package expo.modules.stopwatchcontrols

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.SystemClock
import android.widget.RemoteViews
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat

object StopwatchNotification {
  private const val CHANNEL_ID = "stopwatch"
  private const val NOTIFICATION_ID = 4711

  /** Crea el canal o, si ya existe, actualiza su nombre/descripción al idioma actual. */
  private fun ensureChannel(context: Context, r: Context) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
    val nm = context.getSystemService(NotificationManager::class.java)
    // Importancia DEFAULT (no LOW) para que se muestre en la pantalla de bloqueo,
    // pero sin sonido ni vibración.
    val channel = NotificationChannel(CHANNEL_ID, r.getString(R.string.sw_channel_name), NotificationManager.IMPORTANCE_DEFAULT).apply {
      description = r.getString(R.string.sw_channel_desc)
      setSound(null, null)
      enableVibration(false)
      setShowBadge(false)
      lockscreenVisibility = android.app.Notification.VISIBILITY_PUBLIC
    }
    nm.createNotificationChannel(channel)
  }

  private fun actionIntent(context: Context, action: String, requestCode: Int): PendingIntent {
    val intent = Intent(context, StopwatchActionReceiver::class.java).setAction(action)
    return PendingIntent.getBroadcast(
      context, requestCode, intent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )
  }

  fun show(context: Context, state: StopwatchState) {
    if (Build.VERSION.SDK_INT >= 33 &&
      ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED
    ) return
    val r = AppSettings.localized(context) // textos en el idioma elegido
    ensureChannel(context, r)

    val elapsed = state.elapsedMs()
    // Chronometer usa elapsedRealtime como base: base = ahora - transcurrido.
    val base = SystemClock.elapsedRealtime() - elapsed
    val restRemaining = state.restRemainingMs()
    val resting = restRemaining > 0
    // Cuenta atrás: base = ahora + lo que queda.
    val restBase = SystemClock.elapsedRealtime() + restRemaining
    val series = state.seriesControls
    val stopwatchUsed = state.isRunning || elapsed > 0
    // Con un ejercicio en marcha y el cronómetro sin usar, la línea grande muestra el progreso
    // ("2/4") en vez de un 00:00 sin sentido.
    val showProgress = series && !stopwatchUsed
    val progress = "${minOf(state.sets + 1, state.setsTarget)}/${state.setsTarget}"
    val status = when {
      resting -> r.getString(R.string.sw_status_rest)
      series && state.exerciseDone ->
        if (showProgress) r.getString(R.string.sw_status_done) else r.getString(R.string.sw_status_done_progress, progress)
      series -> if (showProgress) r.getString(R.string.sw_status_set) else r.getString(R.string.sw_status_set_progress, progress)
      state.isRunning -> r.getString(R.string.sw_status_running)
      elapsed > 0 -> r.getString(R.string.sw_status_paused)
      else -> r.getString(R.string.sw_status_stopped)
    }

    val toggleIntent = actionIntent(context, StopwatchActionReceiver.ACTION_TOGGLE, 1)
    val resetIntent = actionIntent(context, StopwatchActionReceiver.ACTION_RESET, 2)
    val restIntent = actionIntent(context, StopwatchActionReceiver.ACTION_REST, 4)
    val dismissIntent = actionIntent(context, StopwatchActionReceiver.ACTION_DISMISSED, 5)

    // Los botones van dentro de la vista personalizada para que se vean
    // también con la notificación contraída (como suele mostrarse en la pantalla de bloqueo).
    fun views(layout: Int) = RemoteViews(context.packageName, layout).apply {
      setChronometer(R.id.stopwatch_chrono, base, null, state.isRunning)
      setViewVisibility(R.id.stopwatch_chrono, if (showProgress) android.view.View.GONE else android.view.View.VISIBLE)
      setViewVisibility(R.id.stopwatch_title, if (showProgress) android.view.View.VISIBLE else android.view.View.GONE)
      setTextViewText(R.id.stopwatch_title, progress)
      setTextViewText(R.id.stopwatch_status, status)

      setImageViewResource(R.id.stopwatch_toggle, if (state.isRunning) R.drawable.ic_sw_pause else R.drawable.ic_sw_play)
      setInt(R.id.stopwatch_toggle, "setBackgroundResource", if (state.isRunning) R.drawable.bg_sw_orange else R.drawable.bg_sw_green)
      setContentDescription(
        R.id.stopwatch_toggle,
        r.getString(
          when {
            state.isRunning -> R.string.sw_a11y_pause
            elapsed > 0 -> R.string.sw_a11y_resume
            else -> R.string.sw_a11y_start
          }
        ),
      )
      setOnClickPendingIntent(R.id.stopwatch_toggle, toggleIntent)

      setViewVisibility(R.id.stopwatch_reset, if (state.isRunning || elapsed > 0) android.view.View.VISIBLE else android.view.View.GONE)
      setContentDescription(R.id.stopwatch_reset, r.getString(R.string.sw_a11y_reset))
      setOnClickPendingIntent(R.id.stopwatch_reset, resetIntent)

      // Descanso: cuenta atrás animada por el sistema + botón iniciar/cancelar.
      setViewVisibility(R.id.stopwatch_rest, if (resting) android.view.View.VISIBLE else android.view.View.GONE)
      setChronometer(R.id.stopwatch_rest, restBase, null, resting)
      setChronometerCountDown(R.id.stopwatch_rest, true)
      // Botón ⏳/✓/⏭ (ver StopwatchStore.notificationRestButton).
      val (icon, description) = when {
        resting -> R.drawable.ic_sw_close to r.getString(R.string.sw_a11y_skip_rest)
        series && state.exerciseDone -> R.drawable.ic_sw_next to r.getString(R.string.sw_a11y_next_exercise)
        series -> R.drawable.ic_sw_check to r.getString(R.string.sw_a11y_set_done, state.sets + 1)
        else -> R.drawable.ic_sw_rest to r.getString(R.string.sw_a11y_rest_for, (state.restDurationMs / 1000).toInt())
      }
      setImageViewResource(R.id.stopwatch_rest_button, icon)
      setInt(R.id.stopwatch_rest_button, "setBackgroundResource", if (resting) R.drawable.bg_sw_blue else R.drawable.bg_sw_blue_dim)
      setContentDescription(R.id.stopwatch_rest_button, description)
      setOnClickPendingIntent(R.id.stopwatch_rest_button, restIntent)
    }

    val launch = context.packageManager.getLaunchIntentForPackage(context.packageName)?.let {
      PendingIntent.getActivity(context, 0, it, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
    }

    val builder = NotificationCompat.Builder(context, CHANNEL_ID)
      .setSmallIcon(R.drawable.ic_stopwatch)
      .setStyle(NotificationCompat.DecoratedCustomViewStyle())
      .setCustomContentView(views(R.layout.stopwatch_notification))
      .setCustomBigContentView(views(R.layout.stopwatch_notification_big))
      .setContentTitle(r.getString(R.string.sw_title))
      .setContentText(status)
      .setCategory(NotificationCompat.CATEGORY_STOPWATCH)
      .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
      .setOngoing(true)
      .setOnlyAlertOnce(true)
      .setSilent(true)
      .setShowWhen(false)
      .setContentIntent(launch)
      // Si se quita deslizando (Android 14+), se vuelve a publicar mientras haya algo en marcha.
      .setDeleteIntent(dismissIntent)

    try {
      NotificationManagerCompat.from(context).notify(NOTIFICATION_ID, builder.build())
    } catch (e: SecurityException) {
      // Permiso revocado mientras tanto; no hay nada que mostrar.
    }
  }

  /** Actualiza el nombre del canal al idioma actual (Ajustes del sistema → Notificaciones). */
  fun refreshChannel(context: Context) = ensureChannel(context, AppSettings.localized(context))

  fun cancel(context: Context) {
    NotificationManagerCompat.from(context).cancel(NOTIFICATION_ID)
  }
}
