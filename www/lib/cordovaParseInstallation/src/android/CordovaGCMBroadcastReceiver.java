package org.apache.cordova.plugin.parse;

import android.content.Context;

import com.google.android.gcm.GCMBroadcastReceiver;
import static com.google.android.gcm.GCMConstants.DEFAULT_INTENT_SERVICE_CLASS_NAME;

/*
 * Implementation of GCMBroadcastReceiver that hard-wires the intent service to be 
 * org.apache.cordova.plugin.parse.GCMIntentService, instead of your_package.GCMIntentService 
 */
public class CordovaGCMBroadcastReceiver extends GCMBroadcastReceiver {
	
	@Override
	protected String getGCMIntentServiceClassName(Context context) {
    	return "org.apache.cordova.plugin.parse" + DEFAULT_INTENT_SERVICE_CLASS_NAME;
    }
	
}