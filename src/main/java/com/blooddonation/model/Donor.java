package com.blooddonation.model;

public class Donor extends User {
    private BloodGroup bloodGroup;
    private boolean isAvailable;
    private String lastDonationDate;

    public Donor() {
        this.setUserType("DONOR");
    }

    public Donor(String id, String name, String contactNumber, String location, BloodGroup bloodGroup) {
        super(id, name, contactNumber, location, "DONOR");
        this.bloodGroup = bloodGroup;
        this.isAvailable = true;
    }

    public BloodGroup getBloodGroup() { return bloodGroup; }
    public void setBloodGroup(BloodGroup bloodGroup) { this.bloodGroup = bloodGroup; }

    public boolean isAvailable() { return isAvailable; }
    public void setAvailable(boolean available) { isAvailable = available; }

    public String getLastDonationDate() { return lastDonationDate; }
    public void setLastDonationDate(String lastDonationDate) { this.lastDonationDate = lastDonationDate; }
}
