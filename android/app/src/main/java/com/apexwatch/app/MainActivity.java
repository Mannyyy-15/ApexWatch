package com.apexwatch.app;

import android.app.PictureInPictureParams;
import android.os.Build;
import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        registerPlugin(AppPIP.class);
    }

    @Override
    protected void onUserLeaveHint() {
        super.onUserLeaveHint();
        if (AppPIP.isPipEnabled && Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            PictureInPictureParams params = new PictureInPictureParams.Builder().build();
            enterPictureInPictureMode(params);
        }
    }
}
