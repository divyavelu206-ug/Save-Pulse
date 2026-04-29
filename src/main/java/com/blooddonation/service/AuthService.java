package com.blooddonation.service;

import com.blooddonation.model.User;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

public class AuthService {
    
    // In-memory password map (username or phone -> password)
    private static Map<String, String> userPasswords = new HashMap<>(); 
    private static Map<String, User> userCredentials = new HashMap<>();
    
    private static User currentUser = null;

    public static boolean register(User user, String contactNumber, String password) {
        if (userCredentials.containsKey(contactNumber)) {
            return false; // User already exists!
        }
        user.setId(UUID.randomUUID().toString());
        userCredentials.put(contactNumber, user);
        userPasswords.put(contactNumber, password);
        DatabaseService.saveUser(user);
        return true;
    }
    
    public static User login(String contactNumber, String password) {
        if (userPasswords.containsKey(contactNumber) && userPasswords.get(contactNumber).equals(password)) {
            currentUser = userCredentials.get(contactNumber);
            return currentUser;
        }
        return null;
    }

    public static void logout() {
        currentUser = null;
    }

    public static User getCurrentUser() {
        return currentUser;
    }
}
