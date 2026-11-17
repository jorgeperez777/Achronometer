package expo.modules.stopwatchcontrols

import android.content.Context
import android.content.res.Configuration
import android.os.Bundle
import java.util.Locale

/**
 * Ajustes del usuario. Viven en nativo porque la notificación, los avisos y la vibración se
 * generan también con la app cerrada (sin JS).
 */
object AppSettings {
  private const val PREFS = "stopwatch_controls"
  const val LANGUAGE_SYSTEM = "system"
  private val LANGUAGES = setOf(LANGUAGE_SYSTEM, "es", "en")
  private val THEMES = setOf("system", "dark", "light")

  private fun prefs(context: Context) = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

  /** "system" (por defecto), "es" o "en". */
  fun language(context: Context): String =
    prefs(context).getString("language", LANGUAGE_SYSTEM).takeIf { it in LANGUAGES } ?: LANGUAGE_SYSTEM

  /** Tema de la app: "system" (por defecto), "dark" o "light". Solo lo usa la app (JS). */
  fun theme(context: Context): String =
    prefs(context).getString("theme", "system").takeIf { it in THEMES } ?: "system"

  /** Vibración de confirmación al tocar los controles. */
  fun hapticsEnabled(context: Context) = prefs(context).getBoolean("hapticsEnabled", true)

  /** Vibración del aviso de fin de descanso / ejercicio. */
  fun alertVibration(context: Context) = prefs(context).getBoolean("alertVibration", true)

  /** Sonido del aviso de fin de descanso / ejercicio. */
  fun alertSound(context: Context) = prefs(context).getBoolean("alertSound", true)

  fun toBundle(context: Context): Bundle = Bundle().apply {
    putString("language", language(context))
    putString("theme", theme(context))
    putBoolean("hapticsEnabled", hapticsEnabled(context))
    putBoolean("alertVibration", alertVibration(context))
    putBoolean("alertSound", alertSound(context))
  }

  /** Aplica solo las claves presentes y válidas. */
  fun update(context: Context, values: Map<String, Any?>) {
    val e = prefs(context).edit()
    (values["language"] as? String)?.takeIf { it in LANGUAGES }?.let { e.putString("language", it) }
    (values["theme"] as? String)?.takeIf { it in THEMES }?.let { e.putString("theme", it) }
    (values["hapticsEnabled"] as? Boolean)?.let { e.putBoolean("hapticsEnabled", it) }
    (values["alertVibration"] as? Boolean)?.let { e.putBoolean("alertVibration", it) }
    (values["alertSound"] as? Boolean)?.let { e.putBoolean("alertSound", it) }
    e.commit()
  }

  /**
   * Context con el idioma elegido para leer los textos (R.string). Con "system" Android elige
   * solo: values-es para español y values (inglés) para cualquier otro idioma.
   */
  fun localized(context: Context): Context {
    val lang = language(context)
    if (lang == LANGUAGE_SYSTEM) return context
    val config = Configuration(context.resources.configuration)
    config.setLocale(Locale(lang))
    return context.createConfigurationContext(config)
  }
}
