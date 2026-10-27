package com.findmypg.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.Column;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "favourites", uniqueConstraints = @UniqueConstraint(columnNames = {"student_id", "listing_id"}))
public class Favourite {
    @Id
    @GeneratedValue
    public UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "student_id", nullable = false)
    public AppUser student;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "listing_id", nullable = false)
    public PgListing listing;

    @Column(nullable = false, updatable = false)
    public Instant createdAt = Instant.now();

    protected Favourite() {
    }

    public Favourite(AppUser student, PgListing listing) {
        this.student = student;
        this.listing = listing;
    }
}