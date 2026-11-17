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

/** Aviso (vibración + sonido) de que terminó el descanso o el ejercicio. */
object RestDoneAlert {
  private const val CHANNEL_ID = "rest_done"
  private const val NOTIFICATION_ID = 4712
  private val VIBRATION = longArrayOf(0, 400, 200, 400, 200, 600)

  private fun ensureChannel(context: Context) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
    val nm = context.getSystemService(NotificationManager::class.java)
    if (nm.getNotificationChannel(CHANNEL_ID) != null) return
    val channel = NotificationChannel(CHANNEL_ID, "Fin del descanso", NotificationManager.IMPORTANCE_HIGH).apply {
      description = "Avisa con vibración y sonido cuando termina el descanso"
      enableVibration(true)
      vibrationPattern = VIBRATION
      setSound(
        RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION),
        AudioAttributes.Builder()
          .setUsage(AudioAttributes.USAGE_NOTIFICATION_EVENT)
          .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
          .build()
      )
      setShowBadge(false)
      lockscreenVisibility = android.app.Notification.VISIBILITY_PUBLIC
    }
    nm.createNotificationChannel(channel)
  }

  fun show(context: Context, title: String, text: String) {
    if (Build.VERSION.SDK_INT >= 33 &&
      ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED
    ) return
    ensureChannel(context)

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
      // Android 7 (sin canales): vibración y sonido por notificación.
      .setVibrate(VIBRATION)
      .setDefaults(NotificationCompat.DEFAULT_SOUND)
      .setAutoCancel(true)
      .setTimeoutAfter(20_000)
      .setContentIntent(launch)
      .build()

    try {
      NotificationManagerCompat.from(context).notify(NOTIFICATION_ID, notification)
    } catch (e: SecurityException) {
      // Permiso revocado; no hay nada que mostrar.
    }
  }

  fun cancel(context: Context) {
    NotificationManagerCompat.from(context).cancel(NOTIFICATION_ID)
  }
}
