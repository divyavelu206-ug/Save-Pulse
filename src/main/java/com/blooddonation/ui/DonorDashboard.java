package com.blooddonation.ui;

import com.blooddonation.model.Donor;
import com.blooddonation.model.User;
import com.blooddonation.service.AuthService;
import com.blooddonation.service.BloodRequestManager;

import javax.swing.*;
import java.awt.*;

public class DonorDashboard extends JFrame {
    private Donor currentDonor;
    private JCheckBox availableCheckBox;

    public DonorDashboard(User user) {
        this.currentDonor = (Donor) user;
        setTitle("Donor Dashboard - Welcome " + user.getName());
        setSize(500, 300);
        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        setLocationRelativeTo(null);

        initUI();
    }

    private void initUI() {
        JPanel panel = new JPanel(new GridLayout(5, 1, 10, 10));
        panel.setBorder(BorderFactory.createEmptyBorder(20, 20, 20, 20));

        panel.add(new JLabel("Welcome, " + currentDonor.getName() + " (Blood Group: " + currentDonor.getBloodGroup().getLabel() + ")"));
        
        availableCheckBox = new JCheckBox("I am currently available to donate blood");
        availableCheckBox.setSelected(currentDonor.isAvailable());
        panel.add(availableCheckBox);

        JButton saveButton = new JButton("Update Availability");
        saveButton.addActionListener(e -> {
            BloodRequestManager.updateAvailability(currentDonor, availableCheckBox.isSelected());
            JOptionPane.showMessageDialog(this, "Status updated successfully!");
        });
        panel.add(saveButton);

        JButton logoutButton = new JButton("Logout");
        logoutButton.addActionListener(e -> {
            AuthService.logout();
            new LoginFrame().setVisible(true);
            this.dispose();
        });
        panel.add(logoutButton);

        add(panel);
    }
}
