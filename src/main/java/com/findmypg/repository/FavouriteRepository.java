package com.findmypg.repository;

import com.findmypg.domain.Favourite;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface FavouriteRepository extends JpaRepository<Favourite, UUID> {
    List<Favourite> findByStudent_IdOrderByCreatedAtDesc(UUID studentId);
    boolean existsByStudent_IdAndListing_Id(UUID studentId, UUID listingId);
    void deleteByStudent_IdAndListing_Id(UUID studentId, UUID listingId);
}