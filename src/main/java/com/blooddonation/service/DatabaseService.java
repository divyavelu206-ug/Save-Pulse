package com.blooddonation.service;

import com.blooddonation.model.Donor;
import com.blooddonation.model.Receiver;
import com.blooddonation.model.User;

import java.util.ArrayList;
import java.util.List;

public class DatabaseService {

    // For simplicity without a service account JSON, we will use in-memory lists as a fallback
    // In a production app, we would use FirebaseDatabase.getInstance().getReference(...)
    
    private static List<User> users = new ArrayList<>();
    private static boolean useFirebase = false; // set to true if initialize() succeeds

    public static void saveUser(User user) {
        if (!users.contains(user)) {
            users.add(user);
        }
    }

    public static List<User> getAllUsers() {
        return users;
    }

    public static List<Donor> getAllDonors() {
        List<Donor> donors = new ArrayList<>();
        for (User u : users) {
            if (u instanceof Donor) {
                donors.add((Donor) u);
            }
        }
        return donors;
    }

    public static List<Receiver> getAllReceivers() {
        List<Receiver> receivers = new ArrayList<>();
        for (User u : users) {
            if (u instanceof Receiver) {
                receivers.add((Receiver) u);
            }
        }
        return receivers;
    }
}
