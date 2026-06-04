package com.apexwatch.app;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "AppPIP")
public class AppPIP extends Plugin {

    public static boolean isPipEnabled = false;

    @PluginMethod
    public void setPipEnabled(PluginCall call) {
        Boolean enabled = call.getBoolean("enabled");
        if (enabled != null) {
            isPipEnabled = enabled;
            call.resolve();
        } else {
            call.reject("Must provide enabled boolean");
        }
    }
}
