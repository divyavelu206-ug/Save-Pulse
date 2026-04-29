package com.blooddonation.model;

public class Receiver extends User {
    private BloodGroup requiredBloodGroup;

    public Receiver() {
        this.setUserType("RECEIVER");
    }

    public Receiver(String id, String name, String contactNumber, String location, BloodGroup requiredBloodGroup) {
        super(id, name, contactNumber, location, "RECEIVER");
        this.requiredBloodGroup = requiredBloodGroup;
    }

    public BloodGroup getRequiredBloodGroup() { return requiredBloodGroup; }
    public void setRequiredBloodGroup(BloodGroup requiredBloodGroup) { this.requiredBloodGroup = requiredBloodGroup; }
}
