package app.lovable.e24ddf4173894a6b8cc3ce614c39dec3.plugins

import android.content.Intent
import android.net.Uri
import com.getcapacitor.*
import com.getcapacitor.annotation.CapacitorPlugin
import java.io.File
import java.io.FileOutputStream

@CapacitorPlugin(name = "ModelImportert")
class ModelImportertPlugin : Plugin() {

    @PluginMethod
    fun importFromUri(call: PluginCall) {
        val uriStr = call.getString("uri") ?: return call.reject("uri requerido")
        val fileName = call.getString("fileName") ?: "model.gguf"

        try {
            val ctx = context
            val uri = Uri.parse(uriStr)

            // Persistir permiso si viene del SAF (content://)
            try {
                ctx.contentResolver.takePersistableUriPermission(
                    uri, Intent.FLAG_GRANT_READ_URI_PERMISSION
                )
            } catch (_: Exception) {}

            // Obtener tamaño del archivo original
            val totalBytes = try {
                ctx.contentResolver.openAssetFileDescriptor(uri, "r")?.use { it.length } ?: 0L
            } catch (_: Exception) {
                0L
            }

            // Destino: /data/data/<paquete>/files/models/
            val modelsDir = File(ctx.filesDir, "models").apply { if (!exists()) mkdirs() }
            val outFile = File(modelsDir, fileName)

            // --- STREAMING CON PROGRESO ---
            var bytesCopied = 0L
            var lastProgressUpdate = 0

            ctx.contentResolver.openInputStream(uri).use { input ->
                FileOutputStream(outFile).use { output ->
                    val buffer = ByteArray(64 * 1024) // 64KB
                    var bytesRead: Int

                    while (input!!.read(buffer).also { bytesRead = it } != -1) {
                        output.write(buffer, 0, bytesRead)
                        bytesCopied += bytesRead

                        // Emitir progreso cada 1%
                        if (totalBytes > 0) {
                            val progress = ((bytesCopied * 100) / totalBytes).toInt()
                            if (progress > lastProgressUpdate) {
                                lastProgressUpdate = progress
                                val progressData = JSObject().apply {
                                    put("progress", progress)
                                    put("bytesCopied", bytesCopied)
                                    put("totalBytes", totalBytes)
                                }
                                notifyListeners("importProgress", progressData)
                            }
                        }
                    }
                    output.flush()
                    output.fd.sync()
                }
            }

            // Respuesta final
            val ret = JSObject().apply {
                put("destPath", outFile.absolutePath)
                put("fileSize", bytesCopied)
                put("fileName", fileName)
            }
            call.resolve(ret)

        } catch (e: Exception) {
            call.reject("Error importando modelo: ${e.message}", e)
        }
    }
}
