package app.lovable.e24ddf4173894a6b8cc3ce614c39dec3;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import app.lovable.e24ddf4173894a6b8cc3ce614c39dec3.plugins.ModelImporterPlugin;
import android.util.Log;

public class MainActivity extends BridgeActivity { 
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(ModelImporterPlugin.class);
        Log.i("MainActivity", "Registering ModelImporterPlugin"); // <-- LOG de verificación
        super.onCreate(savedInstanceState);    
    }       
}
