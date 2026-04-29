package com.blooddonation.ui;

import com.blooddonation.model.BloodGroup;
import com.blooddonation.model.Donor;
import com.blooddonation.model.Receiver;
import com.blooddonation.model.User;
import com.blooddonation.service.AuthService;
import com.blooddonation.service.BloodRequestManager;

import javax.swing.*;
import javax.swing.table.DefaultTableModel;
import java.awt.*;
import java.util.List;

public class ReceiverDashboard extends JFrame {
    private Receiver currentReceiver;
    private JComboBox<String> bloodGroupCombo;
    private JTextField locationField;
    private JTable resultsTable;
    private DefaultTableModel tableModel;

    public ReceiverDashboard(User user) {
        this.currentReceiver = (Receiver) user;
        setTitle("Receiver Dashboard - Welcome " + user.getName());
        setSize(700, 500);
        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        setLocationRelativeTo(null);

        initUI();
    }

    private void initUI() {
        JPanel topPanel = new JPanel(new FlowLayout());
        topPanel.add(new JLabel("Search Blood Group:"));
        
        String[] bgs = new String[]{"A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"};
        bloodGroupCombo = new JComboBox<>(bgs);
        if (currentReceiver.getRequiredBloodGroup() != null) {
            bloodGroupCombo.setSelectedItem(currentReceiver.getRequiredBloodGroup().getLabel());
        }
        topPanel.add(bloodGroupCombo);

        topPanel.add(new JLabel("Location:"));
        locationField = new JTextField(10);
        topPanel.add(locationField);

        JButton searchButton = new JButton("Search Donors");
        searchButton.addActionListener(e -> performSearch());
        topPanel.add(searchButton);

        JButton logoutButton = new JButton("Logout");
        logoutButton.addActionListener(e -> {
            AuthService.logout();
            new LoginFrame().setVisible(true);
            this.dispose();
        });
        topPanel.add(logoutButton);

        // Table
        String[] columnNames = {"Name", "Blood Group", "Contact Number", "Location"};
        tableModel = new DefaultTableModel(columnNames, 0) {
            @Override
            public boolean isCellEditable(int row, int column) {
                return false; // read-only
            }
        };
        resultsTable = new JTable(tableModel);
        JScrollPane scrollPane = new JScrollPane(resultsTable);

        add(topPanel, BorderLayout.NORTH);
        add(scrollPane, BorderLayout.CENTER);
        
        // Initial search
        performSearch();
    }

    private void performSearch() {
        String bgText = (String) bloodGroupCombo.getSelectedItem();
        BloodGroup bg = BloodGroup.fromString(bgText);
        String location = locationField.getText();

        List<Donor> donors = BloodRequestManager.searchAvailableDonors(bg, location);
        
        tableModel.setRowCount(0); // clear existing
        for (Donor d : donors) {
            tableModel.addRow(new Object[]{
                d.getName(),
                d.getBloodGroup().getLabel(),
                d.getContactNumber(),
                d.getLocation()
            });
        }
        
    }
}
