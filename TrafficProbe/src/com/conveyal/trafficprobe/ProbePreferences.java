package com.conveyal.trafficprobe;

import android.os.Bundle;
import android.preference.PreferenceActivity;

public class ProbePreferences extends PreferenceActivity {

	@Override
	protected void onCreate(Bundle savedInstanceState) {

		super.onCreate(savedInstanceState);
		addPreferencesFromResource(R.xml.preferences);

	}


}
