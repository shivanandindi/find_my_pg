package com.findmypg.domain;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OrderColumn;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "pg_listings")
public class PgListing {
    @Id
    @GeneratedValue
    public UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "owner_id", nullable = false)
    public AppUser owner;

    @Column(nullable = false, length = 80)
    public String name;

    @Column(nullable = false, length = 100)
    public String area;

    @Column(nullable = false, length = 300)
    public String address;

    public Double latitude;
    public Double longitude;

    @Column(nullable = false, precision = 10, scale = 2)
    public BigDecimal rent;

    @Column(nullable = false, precision = 10, scale = 2)
    public BigDecimal deposit;

    @Column(nullable = false)
    public int sharing;

    @Column(nullable = false, length = 12)
    public String genderPreference;

    @Column(nullable = false)
    public int vacancies;

    @Column(nullable = false, length = 24)
    public String contactPhone;

    @Column(length = 600)
    public String description;

    @Column(nullable = false)
    public boolean available = true;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "pg_listing_amenities", joinColumns = @JoinColumn(name = "listing_id"))
    @Column(name = "amenity", nullable = false, length = 32)
    public Set<String> amenities = new LinkedHashSet<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "pg_listing_photos", joinColumns = @JoinColumn(name = "listing_id"))
    @OrderColumn(name = "photo_order")
    @Column(name = "photo_data", nullable = false, length = 2000000)
    public List<String> photos = new ArrayList<>();

    @Column(nullable = false, updatable = false)
    public Instant createdAt = Instant.now();

    public PgListing() {
    }
}