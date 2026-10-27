package com.findmypg.config;

import com.findmypg.domain.AppUser;
import com.findmypg.domain.PgListing;
import com.findmypg.domain.Role;
import com.findmypg.repository.AppUserRepository;
import com.findmypg.repository.PgListingRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Configuration
public class SampleListings {
    @Bean
    CommandLineRunner seedListings(AppUserRepository users, PgListingRepository listings,
            PasswordEncoder passwords) {
        return args -> {
            if (listings.count() > 0) return;
            AppUser sampleOwner = new AppUser("Find My PG Sample Host", "sample-host@findmypg.invalid",
                    passwords.encode(UUID.randomUUID().toString()), "0000000000", Role.OWNER);
            sampleOwner.businessName = "Find My PG Sample Homes";
            sampleOwner.businessAddress = "Bengaluru";
            users.save(sampleOwner);

            add(listings, sampleOwner, "The Willow House", "Indiranagar", "12th Main, HAL 2nd Stage, Bengaluru", 14500, 30000, 2, "women", 3,
                    Set.of("Wi-Fi", "Food", "Laundry", "AC"), "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=900&q=85",
                    "A bright, easygoing home tucked into a leafy lane. Find a sunny balcony, home-cooked meals and a friendly house team that makes settling in feel simple.");
            add(listings, sampleOwner, "Mango Tree Living", "Koramangala", "5th Block, Koramangala, Bengaluru", 11000, 22000, 3, "any", 2,
                    Set.of("Wi-Fi", "Food", "Laundry", "Parking"), "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=900&q=85",
                    "Room to breathe, people to share a meal with and Koramangala just outside your door. A relaxed community stay with flexible meal plans.");
            add(listings, sampleOwner, "The Green Door PG", "HSR Layout", "Sector 2, HSR Layout, Bengaluru", 9500, 19000, 2, "men", 4,
                    Set.of("Wi-Fi", "Food", "AC", "Parking"), "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=900&q=85",
                    "A comfortable, well-kept place in the heart of HSR. Easy access to daily essentials, shared spaces that stay tidy and a responsive on-site manager.");
            add(listings, sampleOwner, "Little Nest Co-living", "Whitefield", "Nallurhalli, Whitefield, Bengaluru", 18000, 36000, 1, "women", 1,
                    Set.of("Wi-Fi", "Food", "Laundry", "AC", "Parking"), "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=900&q=85",
                    "A little extra breathing room, with a private balcony and thoughtful shared spaces. Ideal for someone who likes a quiet reset after a busy day.");
            add(listings, sampleOwner, "Terrace House", "Jayanagar", "4th Block, Jayanagar, Bengaluru", 12500, 25000, 2, "any", 2,
                    Set.of("Wi-Fi", "Laundry", "Parking"), "https://images.unsplash.com/photo-1600607687644-c7171b42498f?auto=format&fit=crop&w=900&q=85",
                    "A calm, sunlit home in one of Bengaluru's most walkable neighbourhoods. Nearby parks, good coffee and a roof terrace for slow Sunday mornings.");
            add(listings, sampleOwner, "Copper Kettle Homes", "Marathahalli", "AECS Layout, Marathahalli, Bengaluru", 8500, 17000, 4, "men", 3,
                    Set.of("Wi-Fi", "Food", "Laundry"), "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=900&q=85",
                    "Friendly, no-fuss living close to the ORR tech parks. All the everyday essentials are sorted, with a shared kitchen and dependable Wi-Fi.");
        };
    }

    private static void add(PgListingRepository listings, AppUser owner, String name, String area,
            String address, int rent, int deposit, int sharing, String gender, int vacancies,
            Set<String> amenities, String image, String description) {
        PgListing listing = new PgListing();
        listing.owner = owner;
        listing.name = name;
        listing.area = area;
        listing.address = address;
        listing.rent = BigDecimal.valueOf(rent);
        listing.deposit = BigDecimal.valueOf(deposit);
        listing.sharing = sharing;
        listing.genderPreference = gender;
        listing.vacancies = vacancies;
        listing.contactPhone = "0000000000";
        listing.amenities = amenities;
        listing.photos = List.of(image);
        listing.description = description;
        listings.save(listing);
    }
}