package com.blackad.backend;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.blackad.backend.entity.User;
import com.blackad.backend.service.UserService;

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
            if (admin == null) {
                admin = new User();
                admin.setUsername("admin");
                admin.setPassword(passwordEncoder.encode("admin123"));
                admin.setRole("admin");
                admin.setIsActive(1);
                userService.save(admin);
                System.out.println("Admin user created with default password admin123");
            }
        };
    }
}
