package app.lovable.e24ddf4173894a6b8cc3ce614c39dec3.plugins;

import android.content.Intent;
import android.net.Uri;
import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.PluginMethod;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;

@CapacitorPlugin(name = "ModelImporter")
public class ModelImporterPlugin extends Plugin {
  private static final String TAG = "ModelImporterPlugin";

  @PluginMethod()
  public void echo(PluginCall call) {
      String value = call.getString("value");
      JSObject ret = new JSObject();
      ret.put("value", value);
      call.resolve(ret);
  }
 

  @PluginMethod
  public void importFromUri(PluginCall call) {
    Log.i(TAG, "importFromUri called"); // <-- LOG de verificación
    String uriStr = call.getString("uri");
    if (uriStr == null || uriStr.isEmpty()) {
      call.reject("uri requerido");
      return;
    }

    String fileName = call.getString("fileName");
    if (fileName == null || fileName.isEmpty()) fileName = "model.gguf";

    try {
      final android.content.Context ctx = getContext();
      final Uri uri = Uri.parse(uriStr);

      try {
        ctx.getContentResolver().takePersistableUriPermission(
                uri, Intent.FLAG_GRANT_READ_URI_PERMISSION
        );
      } catch (Exception ignore) {}

      long totalBytes;
      try (android.content.res.AssetFileDescriptor afd =
                   ctx.getContentResolver().openAssetFileDescriptor(uri, "r")) {
        totalBytes = (afd != null) ? afd.getLength() : 0L;
      } catch (Exception e) {
        totalBytes = 0L;
      }

      File modelsDir = new File(ctx.getFilesDir(), "models");
      if (!modelsDir.exists()) modelsDir.mkdirs();
      File outFile = new File(modelsDir, fileName);

      long bytesCopied = 0L;
      int lastProgressUpdate = 0;

      try (InputStream input = ctx.getContentResolver().openInputStream(uri);
           FileOutputStream output = new FileOutputStream(outFile)) {

        if (input == null) {
          call.reject("No se pudo abrir el InputStream del URI");
          return;
        }

        byte[] buffer = new byte[64 * 1024];
        int bytesRead;
        while ((bytesRead = input.read(buffer)) != -1) {
          output.write(buffer, 0, bytesRead);
          bytesCopied += bytesRead;

          if (totalBytes > 0) {
            int progress = (int) ((bytesCopied * 100) / totalBytes);
            if (progress > lastProgressUpdate) {
              lastProgressUpdate = progress;
              JSObject progressData = new JSObject();
              progressData.put("progress", progress);
              progressData.put("bytesCopied", bytesCopied);
              progressData.put("totalBytes", totalBytes);
              notifyListeners("importProgress", progressData);
            }
          }
        }

        output.flush();
        try { output.getFD().sync(); } catch (Exception ignore) {}
      }

      JSObject ret = new JSObject();
      ret.put("destPath", outFile.getAbsolutePath());
      ret.put("fileSize", bytesCopied);
      ret.put("fileName", fileName);
      call.resolve(ret);

    } catch (Exception e) {
      call.reject("Error importando modelo: " + e.getMessage(), e);
    }
  }
}
