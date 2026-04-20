package com.smartpesantren.app;

import android.os.Bundle;
import android.util.Log;
import com.getcapacitor.BridgeActivity;
import com.google.firebase.FirebaseApp;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        try {
            // Manual initialization to prevent crash if google-services.json is missing
            FirebaseApp.initializeApp(this);
            Log.d("MainActivity", "Firebase initialized successfully");
        } catch (Exception e) {
            Log.e("MainActivity", "Firebase initialization failed: " + e.getMessage());
        }
    }
}
