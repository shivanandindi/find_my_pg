package com.findmypg.repository;

import com.findmypg.domain.Enquiry;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface EnquiryRepository extends JpaRepository<Enquiry, UUID> {
    List<Enquiry> findByListing_Owner_IdOrderByCreatedAtDesc(UUID ownerId);
    long countByListing_Owner_Id(UUID ownerId);
}