package com.blackad.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.blackad.backend.entity.User;
import com.blackad.backend.mapper.UserMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Service
public class UserDetailsServiceImpl implements UserDetailsService {

    @Autowired
    private UserMapper userMapper;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userMapper.selectOne(new QueryWrapper<User>().eq("username", username));
        if (user == null) {
            throw new UsernameNotFoundException("User not found with username: " + username);
        }
        
        // Check if user is active (isActive == 1)
        boolean enabled = user.getIsActive() != null && user.getIsActive() == 1;
        
        List<GrantedAuthority> authorities = new ArrayList<>();
        if (user.getRole() != null) {
            // Ensure role starts with ROLE_ for hasRole check, or use hasAuthority
            String roleName = user.getRole().toUpperCase();
            if (!roleName.startsWith("ROLE_")) {
                roleName = "ROLE_" + roleName;
            }
            authorities.add(new SimpleGrantedAuthority(roleName));
        }
        return new org.springframework.security.core.userdetails.User(
            user.getUsername(), 
            user.getPassword(), 
            enabled, 
            true, 
            true, 
            true, 
            authorities
        );
    }
}
