package com.blackad.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.mybatis.spring.annotation.MapperScan;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import com.blackad.backend.service.UserService;
import com.blackad.backend.entity.User;
import org.springframework.security.crypto.password.PasswordEncoder;

@SpringBootApplication
@MapperScan("com.blackad.backend.mapper")
public class BackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(BackendApplication.class, args);
    }

    @Bean
    public CommandLineRunner initData(UserService userService, PasswordEncoder passwordEncoder) {
        return args -> {
            User admin = userService.query().eq("username", "admin").one();
            if (admin != null) {
                admin.setPassword(passwordEncoder.encode("admin123"));
                userService.updateById(admin);
                System.out.println("Admin password reset to admin123");
            } else {
                admin = new User();
                admin.setUsername("admin");
                admin.setPassword(passwordEncoder.encode("admin123"));
                admin.setRole("admin");
                admin.setIsActive(true);
                userService.save(admin);
                System.out.println("Admin user created with password admin123");
            }
        };
    }
}
