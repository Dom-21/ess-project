package com.ess.portal.controller;

import com.ess.portal.entity.Role;
import com.ess.portal.entity.User;
import com.ess.portal.exception.BadRequestException;
import com.ess.portal.exception.ResourceNotFoundException;
import com.ess.portal.repository.RoleRepository;
import com.ess.portal.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class AdminController {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;

    public AdminController(UserRepository userRepository, RoleRepository roleRepository) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
    }

    @GetMapping("/users")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }

    @PostMapping("/users/{userId}/roles")
    public ResponseEntity<User> assignRole(@PathVariable Integer userId, @RequestParam String roleName) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
        
        Role role = roleRepository.findByName(roleName)
                .orElseThrow(() -> new ResourceNotFoundException("Role not found: " + roleName));

        if (user.getRoles().contains(role)) {
            throw new BadRequestException("User already has this role");
        }

        user.getRoles().add(role);
        return ResponseEntity.ok(userRepository.save(user));
    }

    @DeleteMapping("/users/{userId}/roles/{roleId}")
    public ResponseEntity<User> removeRole(@PathVariable Integer userId, @PathVariable Integer roleId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
        
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new ResourceNotFoundException("Role not found: " + roleId));

        if (!user.getRoles().contains(role)) {
            throw new BadRequestException("User does not have this role");
        }

        user.getRoles().remove(role);
        return ResponseEntity.ok(userRepository.save(user));
    }
}
