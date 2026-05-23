package com.ess.portal.controller;

import com.ess.portal.dto.JwtResponse;
import com.ess.portal.dto.LoginRequest;
import com.ess.portal.dto.RefreshTokenRequest;
import com.ess.portal.entity.Employee;
import com.ess.portal.entity.User;
import com.ess.portal.exception.BadRequestException;
import com.ess.portal.exception.UnauthorizedException;
import com.ess.portal.repository.EmployeeRepository;
import com.ess.portal.repository.UserRepository;
import com.ess.portal.security.JwtTokenProvider;
import com.ess.portal.security.UserPrincipal;
import com.ess.portal.service.AuditService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private AuditService auditService;

    @PostMapping("/login")
    public ResponseEntity<JwtResponse> authenticateUser(@Valid @RequestBody LoginRequest loginRequest, HttpServletRequest request) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            loginRequest.getEmail(),
                            loginRequest.getPassword()
                    )
            );

            SecurityContextHolder.getContext().setAuthentication(authentication);
            String jwt = tokenProvider.generateToken(authentication);

            UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
            
            // Resolve Employee details
            Employee employee = employeeRepository.findByUserEmail(userPrincipal.getUsername())
                    .orElseThrow(() -> new BadRequestException("Logged-in user is not associated with an Employee profile."));

            // Create and update Refresh Token
            User user = userRepository.findById(userPrincipal.getId())
                    .orElseThrow(() -> new BadRequestException("User record not found"));
            String refreshToken = UUID.randomUUID().toString();
            user.setRefreshToken(refreshToken);
            user.setTokenExpiry(LocalDateTime.now().plusDays(7));
            userRepository.save(user);

            // Fetch authorities (Roles and Permissions)
            List<String> roles = userPrincipal.getAuthorities().stream()
                    .map(GrantedAuthority::getAuthority)
                    .filter(auth -> auth.startsWith("ROLE_"))
                    .map(auth -> auth.substring(5))
                    .collect(Collectors.toList());

            List<String> permissions = userPrincipal.getAuthorities().stream()
                    .map(GrantedAuthority::getAuthority)
                    .filter(auth -> !auth.startsWith("ROLE_"))
                    .collect(Collectors.toList());

            // Audit Log
            auditService.log("LOGIN", "User", user.getId(), user.getEmail(), 
                    request.getRemoteAddr(), request.getHeader("User-Agent"), 
                    null, "Successful login");

            return ResponseEntity.ok(new JwtResponse(
                    jwt,
                    refreshToken,
                    employee.getEmployeeId(),
                    userPrincipal.getUsername(),
                    employee.getFirstName(),
                    employee.getLastName(),
                    roles,
                    permissions,
                    user.getTheme()
            ));

        } catch (Exception ex) {
            throw new UnauthorizedException("Authentication failed: invalid username or password");
        }
    }

    @PostMapping("/refresh-token")
    public ResponseEntity<JwtResponse> refreshToken(@Valid @RequestBody RefreshTokenRequest refreshRequest, HttpServletRequest request) {
        User user = userRepository.findByRefreshToken(refreshRequest.getRefreshToken())
                .orElseThrow(() -> new UnauthorizedException("Invalid refresh token."));

        if (user.getTokenExpiry().isBefore(LocalDateTime.now())) {
            throw new UnauthorizedException("Expired refresh token. Please login again.");
        }

        String newJwt = tokenProvider.generateTokenFromEmail(user.getEmail());
        Employee employee = employeeRepository.findByUser(user)
                .orElseThrow(() -> new BadRequestException("User profile is corrupt."));

        List<String> roles = user.getRoles().stream()
                .map(r -> r.getName())
                .collect(Collectors.toList());

        List<String> permissions = user.getRoles().stream()
                .flatMap(r -> r.getPermissions().stream())
                .map(p -> p.getName())
                .distinct()
                .collect(Collectors.toList());

        auditService.log("REFRESH_TOKEN", "User", user.getId(), user.getEmail(), 
                request.getRemoteAddr(), request.getHeader("User-Agent"), 
                null, "Token refresh processed successfully");

        return ResponseEntity.ok(new JwtResponse(
                newJwt,
                user.getRefreshToken(),
                employee.getEmployeeId(),
                user.getEmail(),
                employee.getFirstName(),
                employee.getLastName(),
                roles,
                permissions,
                user.getTheme()
        ));
    }
    @PutMapping("/theme")
    public ResponseEntity<Void> updateTheme(java.security.Principal principal, @RequestParam String theme) {
        if (principal == null) {
            throw new UnauthorizedException("User not authenticated");
        }
        User user = userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new BadRequestException("User not found"));
        user.setTheme(theme);
        userRepository.save(user);
        return ResponseEntity.ok().build();
    }
}
