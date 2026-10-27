package com.findmypg.api;

import com.findmypg.domain.AppUser;
import com.findmypg.domain.PgListing;
import com.findmypg.domain.Role;
import com.findmypg.repository.AppUserRepository;
import com.findmypg.repository.EnquiryRepository;
import com.findmypg.repository.PgListingRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.UUID;

import static com.findmypg.api.ApiDtos.ListingRequest;
import static com.findmypg.api.ApiDtos.ListingResponse;

@RestController
@RequestMapping("/api")
public class ListingController {
    private final PgListingRepository listings;
    private final AppUserRepository users;
    private final EnquiryRepository enquiries;

    public ListingController(PgListingRepository listings, AppUserRepository users, EnquiryRepository enquiries) {
        this.listings = listings;
        this.users = users;
        this.enquiries = enquiries;
    }

    @GetMapping("/listings")
    @Transactional(readOnly = true)
    List<ListingResponse> publicListings() {
        return listings.findByAvailableTrueOrderByCreatedAtDesc().stream()
                .map(listing -> ListingResponse.from(listing, false)).toList();
    }

    @GetMapping("/listings/{id}")
    @Transactional(readOnly = true)
    ListingResponse publicListing(@PathVariable UUID id) {
        return ListingResponse.from(findListing(id), false);
    }

    @GetMapping("/owner/listings")
    @PreAuthorize("hasRole('OWNER')")
    @Transactional(readOnly = true)
    List<ListingResponse> ownerListings(Authentication authentication) {
        AppUser owner = currentUser(authentication);
        return listings.findByOwner_IdOrderByCreatedAtDesc(owner.id).stream()
                .map(listing -> ListingResponse.from(listing, true)).toList();
    }

    @PostMapping("/owner/listings")
    @PreAuthorize("hasRole('OWNER')")
    ListingResponse create(@Valid @RequestBody ListingRequest input, Authentication authentication) {
        validatePhotos(input.photos());
        PgListing listing = new PgListing();
        listing.owner = currentUser(authentication);
        apply(listing, input);
        return ListingResponse.from(listings.save(listing), true);
    }

    @PutMapping("/owner/listings/{id}")
    @PreAuthorize("hasRole('OWNER')")
    @Transactional
    ListingResponse update(@PathVariable UUID id, @Valid @RequestBody ListingRequest input,
            Authentication authentication) {
        validatePhotos(input.photos());
        PgListing listing = ownedListing(id, authentication);
        apply(listing, input);
        return ListingResponse.from(listings.save(listing), true);
    }

    @PatchMapping("/owner/listings/{id}/availability")
    @PreAuthorize("hasRole('OWNER')")
    @Transactional
    ListingResponse availability(@PathVariable UUID id, @RequestBody AvailabilityRequest input,
            Authentication authentication) {
        PgListing listing = ownedListing(id, authentication);
        listing.available = input.available();
        return ListingResponse.from(listing, true);
    }

    @DeleteMapping("/owner/listings/{id}")
    @PreAuthorize("hasRole('OWNER')")
    @Transactional
    void delete(@PathVariable UUID id, Authentication authentication) {
        PgListing listing = ownedListing(id, authentication);
        listings.delete(listing);
    }

    @GetMapping("/owner/enquiries")
    @PreAuthorize("hasRole('OWNER')")
    @Transactional(readOnly = true)
    List<ApiDtos.EnquiryResponse> ownerEnquiries(Authentication authentication) {
        AppUser owner = currentUser(authentication);
        return enquiries.findByListing_Owner_IdOrderByCreatedAtDesc(owner.id).stream()
                .map(enquiry -> new ApiDtos.EnquiryResponse(enquiry.id, enquiry.listing.id,
                        enquiry.listing.name, enquiry.student.fullName, enquiry.student.email,
                        enquiry.student.phone, "Visit request", enquiry.createdAt)).toList();
    }

    private void apply(PgListing listing, ListingRequest input) {
        listing.name = input.name().trim();
        listing.area = input.area().trim();
        listing.address = input.address().trim();
        listing.latitude = input.latitude();
        listing.longitude = input.longitude();
        listing.rent = input.rent();
        listing.deposit = input.deposit();
        listing.sharing = input.sharing();
        listing.genderPreference = input.genderPreference();
        listing.vacancies = input.vacancies();
        listing.contactPhone = input.contactPhone().trim();
        listing.description = input.description();
        listing.amenities = input.amenities() == null ? new LinkedHashSet<>() : new LinkedHashSet<>(input.amenities());
        listing.photos = input.photos() == null ? new ArrayList<>() : new ArrayList<>(input.photos());
    }

    private void validatePhotos(List<String> photos) {
        if (photos == null) return;
        long total = 0;
        for (String photo : photos) {
            if (photo == null || !(photo.startsWith("data:image/jpeg;base64,")
                    || photo.startsWith("data:image/png;base64,")
                    || photo.startsWith("data:image/webp;base64,"))) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Photos must be JPEG, PNG, or WebP images.");
            }
            total += photo.length();
        }
        if (total > 5_000_000) {
            throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE, "Keep all listing photos under 5 MB total.");
        }
    }

    private PgListing ownedListing(UUID id, Authentication authentication) {
        PgListing listing = findListing(id);
        if (!listing.owner.id.equals(currentUser(authentication).id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Listing not found.");
        }
        return listing;
    }

    private PgListing findListing(UUID id) {
        return listings.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Listing not found."));
    }

    private AppUser currentUser(Authentication authentication) {
        return users.findByEmailIgnoreCase(authentication.getName())
                .filter(user -> user.role == Role.OWNER)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Owner account required."));
    }

    public record AvailabilityRequest(boolean available) { }
}