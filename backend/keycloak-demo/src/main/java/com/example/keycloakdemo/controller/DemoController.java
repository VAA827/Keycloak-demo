package com.example.keycloakdemo.controller;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class DemoController {

    @GetMapping("/public/hello")
    public Map<String, String> publicEndpoint() {
        Map<String, String> response = new HashMap<>();
        response.put("message", "Ez egy publikus endpoint, nincs szükség bejelentkezésre");
        return response;
    }

    @GetMapping("/user/profile")
    @PreAuthorize("hasRole('USER')")
    public Map<String, Object> userProfile(Authentication authentication) {
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Sikeres hitelesítés!");
        response.put("username", authentication.getName());
        response.put("authorities", authentication.getAuthorities());
        return response;
    }

    @GetMapping("/admin/dashboard")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, String> adminDashboard(Authentication authentication) {
        Map<String, String> response = new HashMap<>();
        response.put("message", "Admin dashboard - csak ADMIN role-al elérhető");
        response.put("admin", authentication.getName());
        return response;
    }
}
