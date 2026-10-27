package com.findmypg.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "app_users", uniqueConstraints = @UniqueConstraint(columnNames = "email"))
public class AppUser {
    @Id
    @GeneratedValue
    public UUID id;

    @Column(nullable = false, length = 80)
    public String fullName;

    @Column(nullable = false, length = 254)
    public String email;

    @Column(nullable = false, length = 100)
    public String passwordHash;

    @Column(nullable = false, length = 24)
    public String phone;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 12)
    public Role role;

    @Column(length = 120)
    public String college;

    @Column(length = 120)
    public String course;

    @Column(length = 120)
    public String workplace;

    @Column(length = 120)
    public String preferredArea;

    @Column(length = 120)
    public String businessName;

    @Column(length = 300)
    public String businessAddress;

    @Column(nullable = false, updatable = false)
    public Instant createdAt = Instant.now();

    protected AppUser() {
    }

    public AppUser(String fullName, String email, String passwordHash, String phone, Role role) {
        this.fullName = fullName;
        this.email = email;
        this.passwordHash = passwordHash;
        this.phone = phone;
        this.role = role;
    }
}