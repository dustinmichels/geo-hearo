package com.geohearo.app;

import android.os.Bundle;
import androidx.activity.EdgeToEdge;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Draw behind the system bars; SystemBars.insetsHandling ("native") pads
        // the WebView on Android WebView < 140, where env(safe-area-inset-*) is broken.
        // Must run after super.onCreate: it installs the window decor, and before
        // BridgeActivity switches to AppTheme.NoActionBar the launch theme adds an
        // action bar (titled "GeoHearo", splash drawable as background) over the app.
        EdgeToEdge.enable(this);
    }
}
