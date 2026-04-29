package com.blooddonation;

import java.awt.Desktop;
import java.io.File;
import java.io.IOException;

public class MainApplication {
    public static void main(String[] args) {
        System.out.println("Starting Application...");
        
        try {
            File htmlFile = new File("webapp/index.html");
            if (Desktop.isDesktopSupported() && htmlFile.exists()) {
                System.out.println("Opening website in default browser: " + htmlFile.getAbsolutePath());
                Desktop.getDesktop().browse(htmlFile.toURI());
            } else {
                System.out.println("Cannot open browser automatically or webapp/index.html not found.");
                System.out.println("Please open this file manually: " + htmlFile.getAbsolutePath());
            }
        } catch (IOException e) {
            System.err.println("Error opening website: " + e.getMessage());
        }
    }
}
