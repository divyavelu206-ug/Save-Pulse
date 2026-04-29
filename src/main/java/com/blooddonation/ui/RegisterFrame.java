package com.blooddonation.ui;

import com.blooddonation.model.BloodGroup;
import com.blooddonation.model.Donor;
import com.blooddonation.model.Receiver;
import com.blooddonation.service.AuthService;

import javax.swing.*;
import java.awt.*;

public class RegisterFrame extends JFrame {
    private JTextField nameField, contactField, locationField;
    private JPasswordField passwordField;
    private JComboBox<String> typeCombo;
    private JComboBox<String> bloodGroupCombo;

    public RegisterFrame() {
        setTitle("Blood Donation Finder - Register");
        setSize(450, 400);
        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        setLocationRelativeTo(null);

        initUI();
    }

    private void initUI() {
        JPanel panel = new JPanel(new GridLayout(7, 2, 10, 10));
        panel.setBorder(BorderFactory.createEmptyBorder(20, 20, 20, 20));

        panel.add(new JLabel("Name:"));
        nameField = new JTextField();
        panel.add(nameField);

        panel.add(new JLabel("Contact Number:"));
        contactField = new JTextField();
        panel.add(contactField);

        panel.add(new JLabel("Location:"));
        locationField = new JTextField();
        panel.add(locationField);

        panel.add(new JLabel("Password:"));
        passwordField = new JPasswordField();
        panel.add(passwordField);

        panel.add(new JLabel("Register As:"));
        typeCombo = new JComboBox<>(new String[]{"DONOR", "RECEIVER"});
        panel.add(typeCombo);

        panel.add(new JLabel("Blood Group:"));
        String[] bgs = new String[]{"A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"};
        bloodGroupCombo = new JComboBox<>(bgs);
        panel.add(bloodGroupCombo);

        JButton registerButton = new JButton("Register");
        registerButton.addActionListener(e -> handleRegister());
        panel.add(registerButton);

        JButton backButton = new JButton("Back to Login");
        backButton.addActionListener(e -> {
            new LoginFrame().setVisible(true);
            this.dispose();
        });
        panel.add(backButton);

        add(panel);
    }

    private void handleRegister() {
        String name = nameField.getText();
        String contact = contactField.getText();
        String loc = locationField.getText();
        String pass = new String(passwordField.getPassword());
        String type = (String) typeCombo.getSelectedItem();
        BloodGroup bg = BloodGroup.fromString((String) bloodGroupCombo.getSelectedItem());

        if (name.isEmpty() || contact.isEmpty() || pass.isEmpty()) {
            JOptionPane.showMessageDialog(this, "Please fill required fields", "Error", JOptionPane.ERROR_MESSAGE);
            return;
        }

        boolean success = false;
        if ("DONOR".equals(type)) {
            Donor d = new Donor("", name, contact, loc, bg);
            success = AuthService.register(d, contact, pass);
        } else {
            Receiver r = new Receiver("", name, contact, loc, bg);
            success = AuthService.register(r, contact, pass);
        }

        if (success) {
            JOptionPane.showMessageDialog(this, "Registration Successful!");
            new LoginFrame().setVisible(true);
            this.dispose();
        } else {
            JOptionPane.showMessageDialog(this, "Registration failed, possibly duplicate contact.", "Error", JOptionPane.ERROR_MESSAGE);
        }
    }
}
