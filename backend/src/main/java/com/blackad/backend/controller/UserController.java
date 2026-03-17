package com.blackad.backend.controller;

import java.util.Map;

import com.blackad.backend.entity.User;
import com.blackad.backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.blackad.backend.service.UserService;

@RestController
@RequestMapping("/users")
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @GetMapping("/me")
    public User getCurrentUser(@AuthenticationPrincipal UserDetails userDetails) {
        return userService.query().eq("username", userDetails.getUsername()).one();
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public IPage<User> getAllUsers(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        return userService.page(new Page<>(page, size));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public User createUser(@RequestBody User user) {
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        userService.save(user);
        return user;
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public User updateUser(@PathVariable Long id, @RequestBody User user) {
        user.setId(id);
        if (user.getPassword() != null) {
            user.setPassword(passwordEncoder.encode(user.getPassword()));
        } else {
            // Keep old password if not provided, fetch existing to check?
            // Usually update user doesn't update password unless specified.
            // But here let's assume we just update other fields.
            // To be safe, let's fetch existing user.
            User existing = userService.getById(id);
            if (existing != null) {
                user.setPassword(existing.getPassword());
            }
        }
        userService.updateById(user);
        return user;
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public void deleteUser(@PathVariable Long id) {
        userService.removeById(id);
    }

    @PutMapping("/me/password")
    public void changePassword(@AuthenticationPrincipal UserDetails userDetails, @RequestBody Map<String, String> payload) {
        User user = userService.query().eq("username", userDetails.getUsername()).one();
        if (passwordEncoder.matches(payload.get("old_password"), user.getPassword())) {
            user.setPassword(passwordEncoder.encode(payload.get("new_password")));
            userService.updateById(user);
        } else {
            throw new RuntimeException("Invalid old password");
        }
    }

    @PutMapping("/{id}/reset-password")
    public void resetPassword(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        User user = userService.getById(id);
        if (user != null) {
            user.setPassword(passwordEncoder.encode(payload.get("new_password")));
            userService.updateById(user);
        }
    }
}
