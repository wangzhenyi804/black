package com.blackad.backend.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, Object>> handleRuntimeException(RuntimeException e) {
        Map<String, Object> body = new HashMap<>();
        body.put("message", e.getMessage());
        body.put("status", HttpStatus.BAD_REQUEST.value());
        return new ResponseEntity<>(body, HttpStatus.BAD_REQUEST);
    }
}
