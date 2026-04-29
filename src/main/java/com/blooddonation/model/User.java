package com.blooddonation.model;

public abstract class User {
    private String id;
    private String name;
    private String contactNumber;
    private String location;
    private String userType; // "DONOR" or "RECEIVER"

    public User() {} // Required for Firebase Empty Constructor

    public User(String id, String name, String contactNumber, String location, String userType) {
        this.id = id;
        this.name = name;
        this.contactNumber = contactNumber;
        this.location = location;
        this.userType = userType;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getContactNumber() { return contactNumber; }
    public void setContactNumber(String contactNumber) { this.contactNumber = contactNumber; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public String getUserType() { return userType; }
    public void setUserType(String userType) { this.userType = userType; }
}
