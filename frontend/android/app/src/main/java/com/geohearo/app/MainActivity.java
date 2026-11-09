package com.geohearo.app;

import android.os.Bundle;
import androidx.activity.EdgeToEdge;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // Draw behind the system bars; SystemBars.insetsHandling ("native") pads
        // the WebView on Android WebView < 140, where env(safe-area-inset-*) is broken.
        EdgeToEdge.enable(this);
        super.onCreate(savedInstanceState);
    }
}
