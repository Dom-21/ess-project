package com.ess.portal.security;

import com.ess.portal.entity.User;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.HashSet;
import java.util.Objects;
import java.util.Set;

public class UserPrincipal implements UserDetails {

    private final Integer id;
    private final String email;
    private final String password;
    private final boolean isActive;
    private final Collection<? extends GrantedAuthority> authorities;

    public UserPrincipal(Integer id, String email, String password, boolean isActive,
            Collection<? extends GrantedAuthority> authorities) {
        this.id = id;
        this.email = email;
        this.password = password;
        this.isActive = isActive;
        this.authorities = authorities;
    }

    public static UserPrincipal create(User user) {
        Set<GrantedAuthority> authorities = new HashSet<>();

        // Add Roles as Authorities (prefixed with ROLE_)
        user.getRoles().forEach(role -> {
            authorities.add(new SimpleGrantedAuthority("ROLE_" + role.getName()));
            // Add Permissions as raw authorities
            role.getPermissions()
                    .forEach(permission -> authorities.add(new SimpleGrantedAuthority(permission.getName())));
        });

        return new UserPrincipal(
                user.getId(),
                user.getEmail(),
                user.getPassword(),
                user.getIsActive(),
                authorities);
    }

    public Integer getId() {
        return id;
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return isActive;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o)
            return true;
        if (o == null || getClass() != o.getClass())
            return false;
        UserPrincipal that = (UserPrincipal) o;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
