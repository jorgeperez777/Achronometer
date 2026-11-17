package expo.modules.stopwatchcontrols

import android.content.Context
import android.os.Bundle

/** Estado del cronómetro. Única fuente de verdad para la app y la notificación. */
data class StopwatchState(
  val isRunning: Boolean,
  /** Epoch (ms) del inicio de la tanda actual. Solo válido si isRunning. */
  val startedAt: Double,
  /** Milisegundos acumulados de tandas anteriores. */
  val accumulatedMs: Double,
) {
  fun elapsedMs(now: Long = System.currentTimeMillis()): Long =
    (accumulatedMs + if (isRunning) maxOf(0.0, now - startedAt) else 0.0).toLong()

  fun toBundle(): Bundle = Bundle().apply {
    putBoolean("isRunning", isRunning)
    putDouble("startedAt", startedAt)
    putDouble("accumulatedMs", accumulatedMs)
  }
}

object StopwatchStore {
  private const val PREFS = "stopwatch_controls"
  private val listeners = mutableSetOf<(StopwatchState) -> Unit>()

  fun addListener(l: (StopwatchState) -> Unit) = synchronized(listeners) { listeners.add(l) }
  fun removeListener(l: (StopwatchState) -> Unit) = synchronized(listeners) { listeners.remove(l) }

  fun get(context: Context): StopwatchState {
    val p = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    return StopwatchState(
      isRunning = p.getBoolean("isRunning", false),
      startedAt = p.getLong("startedAt", 0L).toDouble(),
      accumulatedMs = p.getLong("accumulatedMs", 0L).toDouble(),
    )
  }

  private fun save(context: Context, s: StopwatchState) {
    context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit()
      .putBoolean("isRunning", s.isRunning)
      .putLong("startedAt", s.startedAt.toLong())
      .putLong("accumulatedMs", s.accumulatedMs.toLong())
      .commit()
    val snapshot = synchronized(listeners) { listeners.toList() }
    snapshot.forEach { it(s) }
  }

  fun start(context: Context): StopwatchState {
    val s = get(context)
    if (s.isRunning) return s
    val next = s.copy(isRunning = true, startedAt = System.currentTimeMillis().toDouble())
    save(context, next)
    StopwatchNotification.show(context, next)
    return next
  }

  fun pause(context: Context): StopwatchState {
    val s = get(context)
    if (!s.isRunning) return s
    val next = StopwatchState(false, 0.0, s.elapsedMs().toDouble())
    save(context, next)
    StopwatchNotification.show(context, next)
    return next
  }

  fun toggle(context: Context): StopwatchState =
    if (get(context).isRunning) pause(context) else start(context)

  /**
   * @param keepNotification true desde la pantalla de bloqueo (para poder volver a iniciar);
   * false desde la app (se quita la notificación).
   */
  fun reset(context: Context, keepNotification: Boolean): StopwatchState {
    val next = StopwatchState(false, 0.0, 0.0)
    save(context, next)
    if (keepNotification) StopwatchNotification.show(context, next)
    else StopwatchNotification.cancel(context)
    return next
  }
}
