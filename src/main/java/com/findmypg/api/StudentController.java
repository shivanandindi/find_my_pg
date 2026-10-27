package com.findmypg.api;

import com.findmypg.domain.AppUser;
import com.findmypg.domain.Enquiry;
import com.findmypg.domain.Favourite;
import com.findmypg.domain.PgListing;
import com.findmypg.domain.Role;
import com.findmypg.repository.AppUserRepository;
import com.findmypg.repository.EnquiryRepository;
import com.findmypg.repository.FavouriteRepository;
import com.findmypg.repository.PgListingRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

import static com.findmypg.api.ApiDtos.ListingResponse;

@RestController
@RequestMapping("/api")
@PreAuthorize("hasRole('STUDENT')")
public class StudentController {
    private final AppUserRepository users;
    private final PgListingRepository listings;
    private final FavouriteRepository favourites;
    private final EnquiryRepository enquiries;

    public StudentController(AppUserRepository users, PgListingRepository listings,
            FavouriteRepository favourites, EnquiryRepository enquiries) {
        this.users = users;
        this.listings = listings;
        this.favourites = favourites;
        this.enquiries = enquiries;
    }

    @GetMapping("/favourites")
    @Transactional(readOnly = true)
    List<ListingResponse> favourites(Authentication authentication) {
        AppUser student = currentStudent(authentication);
        return favourites.findByStudent_IdOrderByCreatedAtDesc(student.id).stream()
                .map(favourite -> ListingResponse.from(favourite.listing, false)).toList();
    }

    @PostMapping("/favourites/{listingId}")
    @Transactional
    void addFavourite(@PathVariable UUID listingId, Authentication authentication) {
        AppUser student = currentStudent(authentication);
        PgListing listing = findListing(listingId);
        if (!favourites.existsByStudent_IdAndListing_Id(student.id, listing.id)) {
            favourites.save(new Favourite(student, listing));
        }
    }

    @DeleteMapping("/favourites/{listingId}")
    @Transactional
    void removeFavourite(@PathVariable UUID listingId, Authentication authentication) {
        favourites.deleteByStudent_IdAndListing_Id(currentStudent(authentication).id, listingId);
    }

    @PostMapping("/enquiries/{listingId}")
    @Transactional
    ApiDtos.EnquiryResponse createEnquiry(@PathVariable UUID listingId,
            @Valid @RequestBody(required = false) EnquiryRequest input, Authentication authentication) {
        AppUser student = currentStudent(authentication);
        PgListing listing = findListing(listingId);
        if (!listing.available) throw new ResponseStatusException(HttpStatus.CONFLICT, "This PG is not accepting visits right now.");
        Enquiry enquiry = enquiries.save(new Enquiry(student, listing));
        return new ApiDtos.EnquiryResponse(enquiry.id, listing.id, listing.name, student.fullName,
                student.email, student.phone, input == null ? "Visit request" : input.message(), enquiry.createdAt);
    }

    private AppUser currentStudent(Authentication authentication) {
        return users.findByEmailIgnoreCase(authentication.getName())
                .filter(user -> user.role == Role.STUDENT)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Student account required."));
    }

    private PgListing findListing(UUID id) {
        return listings.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Listing not found."));
    }

    public record EnquiryRequest(@Size(max = 300) String message) { }
}