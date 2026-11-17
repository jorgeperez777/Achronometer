package expo.modules.stopwatchcontrols

import android.Manifest
import android.app.AlarmManager
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.media.AudioAttributes
import android.media.RingtoneManager
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat

/**
 * Alarma que marca el fin del descanso. Usa AlarmManager para que suene aunque
 * la app esté cerrada o el teléfono en reposo (Doze).
 */
object RestAlarm {
  private const val REQUEST_CODE = 3

  private fun pendingIntent(context: Context, flags: Int): PendingIntent? {
    val intent = Intent(context, StopwatchActionReceiver::class.java)
      .setAction(StopwatchActionReceiver.ACTION_REST_DONE)
    return PendingIntent.getBroadcast(context, REQUEST_CODE, intent, flags or PendingIntent.FLAG_IMMUTABLE)
  }

  fun schedule(context: Context, endsAtEpochMs: Long) {
    val am = context.getSystemService(AlarmManager::class.java) ?: return
    val pi = pendingIntent(context, PendingIntent.FLAG_UPDATE_CURRENT) ?: return
    // Android 12+: las alarmas exactas requieren permiso (USE_EXACT_ALARM en 13+ se concede solo).
    val canExact = Build.VERSION.SDK_INT < Build.VERSION_CODES.S || am.canScheduleExactAlarms()
    try {
      if (canExact) am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, endsAtEpochMs, pi)
      else am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, endsAtEpochMs, pi)
    } catch (e: SecurityException) {
      am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, endsAtEpochMs, pi)
    }
  }

  fun cancel(context: Context) {
    val pi = pendingIntent(context, PendingIntent.FLAG_NO_CREATE) ?: return
    context.getSystemService(AlarmManager::class.java)?.cancel(pi)
    pi.cancel()
  }
}

/**
 * Aviso de que terminó el descanso o el ejercicio. El canal no tiene sonido ni vibración propios
 * (en Android 8+ no se pueden cambiar desde la app una vez creado el canal): los pone la app según
 * los ajustes del usuario (AppSettings.alertSound / alertVibration).
 */
object RestDoneAlert {
  /** v2: el canal "rest_done" original sonaba y vibraba por su cuenta; se borra. */
  private const val CHANNEL_ID = "rest_done_v2"
  private const val OLD_CHANNEL_ID = "rest_done"
  private const val NOTIFICATION_ID = 4712
  private val VIBRATION = longArrayOf(0, 400, 200, 400, 200, 600)

  private fun ensureChannel(context: Context, r: Context) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
    val nm = context.getSystemService(NotificationManager::class.java)
    if (nm.getNotificationChannel(OLD_CHANNEL_ID) != null) nm.deleteNotificationChannel(OLD_CHANNEL_ID)
    // HIGH: aparece encima (heads-up) y en la pantalla de bloqueo.
    val channel = NotificationChannel(CHANNEL_ID, r.getString(R.string.sw_alert_channel_name), NotificationManager.IMPORTANCE_HIGH).apply {
      description = r.getString(R.string.sw_alert_channel_desc)
      setSound(null, null)
      enableVibration(false)
      setShowBadge(false)
      lockscreenVisibility = android.app.Notification.VISIBILITY_PUBLIC
    }
    nm.createNotificationChannel(channel)
  }

  fun show(context: Context, title: String, text: String) {
    if (Build.VERSION.SDK_INT >= 33 &&
      ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED
    ) return
    ensureChannel(context, AppSettings.localized(context))

    val launch = context.packageManager.getLaunchIntentForPackage(context.packageName)?.let {
      PendingIntent.getActivity(context, 0, it, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
    }

    val notification = NotificationCompat.Builder(context, CHANNEL_ID)
      .setSmallIcon(R.drawable.ic_sw_rest)
      .setContentTitle(title)
      .setContentText(text)
      .setCategory(NotificationCompat.CATEGORY_ALARM)
      .setPriority(NotificationCompat.PRIORITY_HIGH)
      .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
      .setSilent(true) // sonido y vibración los pone la app (abajo)
      .setAutoCancel(true)
      .setTimeoutAfter(20_000)
      .setContentIntent(launch)
      .build()

    try {
      NotificationManagerCompat.from(context).notify(NOTIFICATION_ID, notification)
    } catch (e: SecurityException) {
      return // Permiso revocado; no hay nada que mostrar.
    }

    if (AppSettings.alertVibration(context)) Haptics.vibrate(context, VIBRATION)
    if (AppSettings.alertSound(context)) playSound(context)
  }

  /** Sonido de notificación del sistema (respeta el volumen de notificaciones y el modo silencio). */
  private fun playSound(context: Context) {
    try {
      val uri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION) ?: return
      RingtoneManager.getRingtone(context, uri)?.apply {
        audioAttributes = AudioAttributes.Builder()
          .setUsage(AudioAttributes.USAGE_NOTIFICATION_EVENT)
          .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
          .build()
        play()
      }
    } catch (e: Exception) {
      // Sin sonido disponible: no pasa nada.
    }
  }

  /** Actualiza el nombre del canal al idioma actual (Ajustes del sistema → Notificaciones). */
  fun refreshChannel(context: Context) = ensureChannel(context, AppSettings.localized(context))

  fun cancel(context: Context) {
    NotificationManagerCompat.from(context).cancel(NOTIFICATION_ID)
  }
}
