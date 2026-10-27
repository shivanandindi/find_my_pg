package com.findmypg.api;

import com.findmypg.domain.AppUser;
import com.findmypg.repository.AppUserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.Locale;
import java.util.Map;

import static com.findmypg.api.ApiDtos.UserResponse;
import static org.springframework.http.HttpStatus.CONFLICT;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AppUserRepository users;
    private final PasswordEncoder passwords;
    private final AuthenticationManager authenticationManager;
    private final SecurityContextRepository contextRepository;

    public AuthController(AppUserRepository users, PasswordEncoder passwords,
            AuthenticationManager authenticationManager, SecurityContextRepository contextRepository) {
        this.users = users;
        this.passwords = passwords;
        this.authenticationManager = authenticationManager;
        this.contextRepository = contextRepository;
    }

    @GetMapping("/csrf")
    Map<String, String> csrf(CsrfToken token) {
        return Map.of("token", token.getToken(), "headerName", token.getHeaderName());
    }

    @GetMapping("/me")
    ResponseEntity<UserResponse> me(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) return ResponseEntity.noContent().build();
        return users.findByEmailIgnoreCase(authentication.getName())
                .map(user -> ResponseEntity.ok(UserResponse.from(user)))
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    @PostMapping("/register")
    ResponseEntity<UserResponse> register(@Valid @RequestBody ApiDtos.RegistrationRequest input) {
        String email = input.email().trim().toLowerCase(Locale.ROOT);
        if (users.existsByEmailIgnoreCase(email)) {
            throw new ResponseStatusException(CONFLICT, "An account with that email already exists.");
        }
        if (input.role() == com.findmypg.domain.Role.OWNER
                && (blank(input.businessName()) || blank(input.businessAddress()))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Business name and address are required for owner accounts.");
        }
        if (input.role() == com.findmypg.domain.Role.STUDENT
                && blank(input.college()) && blank(input.workplace())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Add your college or workplace to complete student registration.");
        }
        AppUser user = new AppUser(input.fullName().trim(), email, passwords.encode(input.password()),
                input.phone().trim(), input.role());
        user.college = trim(input.college());
        user.course = trim(input.course());
        user.workplace = trim(input.workplace());
        user.preferredArea = trim(input.preferredArea());
        user.businessName = trim(input.businessName());
        user.businessAddress = trim(input.businessAddress());
        return ResponseEntity.status(HttpStatus.CREATED).body(UserResponse.from(users.save(user)));
    }

    @PostMapping("/login")
    UserResponse login(@Valid @RequestBody ApiDtos.LoginRequest input,
            HttpServletRequest request, HttpServletResponse response) {
        Authentication authentication = authenticationManager.authenticate(
                UsernamePasswordAuthenticationToken.unauthenticated(input.email().trim(), input.password()));
        request.changeSessionId();
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authentication);
        SecurityContextHolder.setContext(context);
        contextRepository.saveContext(context, request, response);
        return users.findByEmailIgnoreCase(authentication.getName())
                .map(UserResponse::from)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Account not found."));
    }

    private static boolean blank(String value) { return value == null || value.isBlank(); }
    private static String trim(String value) { return value == null || value.isBlank() ? null : value.trim(); }
}