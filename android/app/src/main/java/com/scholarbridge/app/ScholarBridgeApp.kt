package com.scholarbridge.app

import android.app.Application
import dagger.hilt.android.HiltAndroidApp

@HiltAndroidApp
class ScholarBridgeApp : Application() {
    override fun onCreate() {
        super.onCreate()
    }
}
