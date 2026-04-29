package com.blooddonation.service;

import com.blooddonation.model.BloodGroup;
import com.blooddonation.model.Donor;

import java.util.ArrayList;
import java.util.List;

public class BloodRequestManager {

    /**
     * Search donors by blood group and optionally location.
     * 
     * @param group The required blood group
     * @param location Optional location to filter by
     * @return List of available donors matching criteria
     */
    public static List<Donor> searchAvailableDonors(BloodGroup group, String location) {
        List<Donor> allDonors = DatabaseService.getAllDonors();
        List<Donor> results = new ArrayList<>();

        for (Donor d : allDonors) {
            if (d.isAvailable() && d.getBloodGroup() == group) {
                if (location == null || location.trim().isEmpty() || 
                    d.getLocation().toLowerCase().contains(location.toLowerCase())) {
                    results.add(d);
                }
            }
        }
        return results;
    }

    /**
     * Change availability of a donor.
     * 
     * @param donor The donor object
     * @param isAvailable new availability status
     */
    public static void updateAvailability(Donor donor, boolean isAvailable) {
        donor.setAvailable(isAvailable);
        // If we were connected to Firebase, we would call a save/update here:
        // DatabaseService.updateUser(donor);
    }
}
