package com.findmypg.api;

import com.findmypg.domain.AppUser;
import com.findmypg.domain.PgListing;
import com.findmypg.domain.Role;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.UUID;

public final class ApiDtos {
    private ApiDtos() { }

    public record RegistrationRequest(
        @NotBlank @Size(max = 80) String fullName,
        @NotBlank @Email @Size(max = 254) String email,
        @NotBlank @Size(min = 12, max = 72) String password,
        @NotBlank @Pattern(regexp = "[+0-9 ()-]{10,24}") String phone,
        @NotNull Role role,
        @Size(max = 120) String college,
        @Size(max = 120) String course,
        @Size(max = 120) String workplace,
        @Size(max = 120) String preferredArea,
        @Size(max = 120) String businessName,
        @Size(max = 300) String businessAddress
    ) { }

    public record LoginRequest(@NotBlank @Email @Size(max = 254) String email,
                               @NotBlank @Size(max = 72) String password) { }

    public record UserResponse(UUID id, String fullName, String email, String phone, Role role,
                               String college, String course, String workplace, String preferredArea,
                               String businessName, String businessAddress) {
        public static UserResponse from(AppUser user) {
            return new UserResponse(user.id, user.fullName, user.email, user.phone, user.role,
                    user.college, user.course, user.workplace, user.preferredArea,
                    user.businessName, user.businessAddress);
        }
    }

    public record ListingRequest(
        @NotBlank @Size(max = 80) String name,
        @NotBlank @Size(max = 100) String area,
        @NotBlank @Size(max = 300) String address,
        Double latitude,
        Double longitude,
        @NotNull @DecimalMin("1000") BigDecimal rent,
        @NotNull @DecimalMin("0") BigDecimal deposit,
        @Min(1) @Max(4) int sharing,
        @NotBlank @Pattern(regexp = "any|women|men") String genderPreference,
        @Min(1) @Max(100) int vacancies,
        @NotBlank @Pattern(regexp = "[+0-9 ()-]{10,24}") String contactPhone,
        @Size(max = 600) String description,
        @Size(max = 10) Set<@Pattern(regexp = "Wi-Fi|Food|Laundry|AC|Parking") String> amenities,
        @Size(max = 5) List<@Size(max = 1800000) String> photos
    ) { }

    public record ListingResponse(UUID id, String name, String area, String address,
                                  Double latitude, Double longitude, BigDecimal rent, BigDecimal deposit,
                                  int sharing, String gender, int vacancies, List<String> amenities,
                                  String image, int images, String description, String distance,
                                  String ownerName, String contactPhone, boolean available,
                                  Instant createdAt, double rating, int reviews) {
        public static ListingResponse from(PgListing listing, boolean revealContact) {
            return new ListingResponse(listing.id, listing.name, listing.area, listing.address,
                    listing.latitude, listing.longitude, listing.rent, listing.deposit, listing.sharing,
                    listing.genderPreference, listing.vacancies, List.copyOf(listing.amenities),
                    listing.photos.isEmpty() ? null : listing.photos.get(0), listing.photos.size(),
                    listing.description, listing.area, listing.owner.fullName,
                    revealContact ? listing.contactPhone : null, listing.available,
                    listing.createdAt, 0, 0);
        }
    }

    public record EnquiryResponse(UUID id, UUID listingId, String listingName, String studentName,
                                  String studentEmail, String studentPhone, String message, Instant createdAt) { }
}