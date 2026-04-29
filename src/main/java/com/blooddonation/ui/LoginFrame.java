package com.blooddonation.ui;

import com.blooddonation.model.User;
import com.blooddonation.service.AuthService;

import javax.swing.*;
import java.awt.*;
import java.awt.event.ActionEvent;

public class LoginFrame extends JFrame {
    private JTextField contactField;
    private JPasswordField passwordField;

    public LoginFrame() {
        setTitle("Blood Donation Finder - Login");
        setSize(400, 250);
        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        setLocationRelativeTo(null);
        
        initUI();
    }

    private void initUI() {
        JPanel panel = new JPanel(new GridLayout(4, 2, 10, 10));
        panel.setBorder(BorderFactory.createEmptyBorder(20, 20, 20, 20));

        panel.add(new JLabel("Contact Number:"));
        contactField = new JTextField();
        panel.add(contactField);

        panel.add(new JLabel("Password:"));
        passwordField = new JPasswordField();
        panel.add(passwordField);

        JButton loginButton = new JButton("Login");
        loginButton.addActionListener(this::handleLogin);
        panel.add(loginButton);

        JButton registerButton = new JButton("Register");
        registerButton.addActionListener(e -> {
            new RegisterFrame().setVisible(true);
            this.dispose();
        });
        panel.add(registerButton);

        add(panel);
    }

    private void handleLogin(ActionEvent e) {
        String contact = contactField.getText();
        String pass = new String(passwordField.getPassword());
        
        User user = AuthService.login(contact, pass);
        if (user != null) {
            JOptionPane.showMessageDialog(this, "Login Successful!");
            if ("DONOR".equals(user.getUserType())) {
                new DonorDashboard(user).setVisible(true);
            } else {
                new ReceiverDashboard(user).setVisible(true);
            }
            this.dispose();
        } else {
            JOptionPane.showMessageDialog(this, "Invalid credentials", "Error", JOptionPane.ERROR_MESSAGE);
        }
    }
}
