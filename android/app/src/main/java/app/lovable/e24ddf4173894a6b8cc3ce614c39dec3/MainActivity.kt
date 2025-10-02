package app.lovable.e24ddf4173894a6b8cc3ce614c39dec3

import com.getcapacitor.BridgeActivity
import app.lovable.e24ddf4173894a6b8cc3ce614c39dec3.plugins.ModelImporterPlugin

class MainActivity : BridgeActivity() {
    override fun onCreate(savedInstanceState: android.os.Bundle?) {
        super.onCreate(savedInstanceState)
        registerPlugin(ModelImporterPlugin::class.java)
    }
}
