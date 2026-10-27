package com.findmypg.repository;

import com.findmypg.domain.PgListing;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface PgListingRepository extends JpaRepository<PgListing, UUID> {
    List<PgListing> findByAvailableTrueOrderByCreatedAtDesc();
    List<PgListing> findByOwner_IdOrderByCreatedAtDesc(UUID ownerId);
}