package expo.modules.stopwatchcontrols

import android.content.Context
import android.media.AudioAttributes
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager

/**
 * Vibración de confirmación al tocar los controles, para saber sin mirar que el toque
 * (sobre todo en la pantalla de bloqueo) funcionó. Cada acción tiene su patrón.
 */
object Haptics {
  enum class Kind(val pattern: LongArray) {
    /** Iniciar / reanudar / iniciar descanso: un pulso corto. */
    START(longArrayOf(0, 45)),
    /** Pausar / cancelar descanso: dos pulsos cortos. */
    STOP(longArrayOf(0, 45, 90, 45)),
    /** Reiniciar / siguiente ejercicio: un pulso largo. */
    RESET(longArrayOf(0, 160)),
    /** Ejercicio completado: largo-corto-largo. */
    DONE(longArrayOf(0, 200, 100, 60, 100, 200)),
  }

  @Suppress("DEPRECATION")
  private fun vibrator(context: Context): Vibrator? =
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      context.getSystemService(VibratorManager::class.java)?.defaultVibrator
    } else {
      context.getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
    }

  /** Vibración de confirmación de un control (si el usuario no la desactivó en Ajustes). */
  fun play(context: Context, kind: Kind) {
    if (AppSettings.hapticsEnabled(context)) vibrate(context, kind.pattern)
  }

  /** Vibra con un patrón, sin mirar ajustes (quien llama decide). */
  @Suppress("DEPRECATION")
  fun vibrate(context: Context, pattern: LongArray) {
    val v = vibrator(context)?.takeIf { it.hasVibrator() } ?: return
    // Uso "alarma": Android ignora las vibraciones de "toque" de apps en segundo plano,
    // y los botones de la notificación se pulsan con la app en segundo plano.
    val attrs = AudioAttributes.Builder()
      .setUsage(AudioAttributes.USAGE_ALARM)
      .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
      .build()
    try {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        v.vibrate(VibrationEffect.createWaveform(pattern, -1), attrs)
      } else {
        v.vibrate(pattern, -1, attrs)
      }
    } catch (e: SecurityException) {
      // Sin permiso VIBRATE: no pasa nada, solo no vibra.
    }
  }
}
