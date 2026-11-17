package expo.modules.stopwatchcontrols

import android.content.Context
import android.os.Bundle

/** Estado del cronómetro + descanso. Única fuente de verdad para la app y la notificación. */
data class StopwatchState(
  val isRunning: Boolean,
  /** Epoch (ms) del inicio de la tanda actual. Solo válido si isRunning. */
  val startedAt: Double,
  /** Milisegundos acumulados de tandas anteriores. */
  val accumulatedMs: Double,
  /** Epoch (ms) en que termina el descanso en curso; 0 = no hay descanso. */
  val restEndsAt: Double = 0.0,
  /** Duración elegida para los descansos. */
  val restDurationMs: Double = StopwatchStore.DEFAULT_REST_MS.toDouble(),
) {
  fun elapsedMs(now: Long = System.currentTimeMillis()): Long =
    (accumulatedMs + if (isRunning) maxOf(0.0, now - startedAt) else 0.0).toLong()

  /** Milisegundos de descanso que quedan; 0 si no hay descanso en curso. */
  fun restRemainingMs(now: Long = System.currentTimeMillis()): Long =
    if (restEndsAt > 0) maxOf(0L, restEndsAt.toLong() - now) else 0L

  fun isResting(now: Long = System.currentTimeMillis()): Boolean = restRemainingMs(now) > 0

  /** Hay algo que mostrar en la notificación. */
  fun hasContent(): Boolean = isRunning || elapsedMs() > 0 || isResting()

  fun toBundle(): Bundle = Bundle().apply {
    putBoolean("isRunning", isRunning)
    putDouble("startedAt", startedAt)
    putDouble("accumulatedMs", accumulatedMs)
    putDouble("restEndsAt", restEndsAt)
    putDouble("restDurationMs", restDurationMs)
  }
}

object StopwatchStore {
  const val DEFAULT_REST_MS = 90_000L
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
      restEndsAt = p.getLong("restEndsAt", 0L).toDouble(),
      restDurationMs = p.getLong("restDurationMs", DEFAULT_REST_MS).toDouble(),
    )
  }

  private fun save(context: Context, s: StopwatchState) {
    context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit()
      .putBoolean("isRunning", s.isRunning)
      .putLong("startedAt", s.startedAt.toLong())
      .putLong("accumulatedMs", s.accumulatedMs.toLong())
      .putLong("restEndsAt", s.restEndsAt.toLong())
      .putLong("restDurationMs", s.restDurationMs.toLong())
      .commit()
    val snapshot = synchronized(listeners) { listeners.toList() }
    snapshot.forEach { it(s) }
  }

  /** Guarda y refleja el estado en la notificación (o la quita si no hay nada que mostrar). */
  private fun commit(context: Context, s: StopwatchState, keepNotification: Boolean = true): StopwatchState {
    save(context, s)
    if (keepNotification || s.hasContent()) StopwatchNotification.show(context, s)
    else StopwatchNotification.cancel(context)
    return s
  }

  // MARK: - Cronómetro

  fun start(context: Context): StopwatchState {
    val s = get(context)
    if (s.isRunning) return s
    Haptics.play(context, Haptics.Kind.START)
    return commit(context, s.copy(isRunning = true, startedAt = System.currentTimeMillis().toDouble()))
  }

  fun pause(context: Context): StopwatchState {
    val s = get(context)
    if (!s.isRunning) return s
    Haptics.play(context, Haptics.Kind.STOP)
    return commit(context, s.copy(isRunning = false, startedAt = 0.0, accumulatedMs = s.elapsedMs().toDouble()))
  }

  fun toggle(context: Context): StopwatchState =
    if (get(context).isRunning) pause(context) else start(context)

  /**
   * Pone el cronómetro a 0 y cancela el descanso.
   * @param keepNotification true desde la pantalla de bloqueo (para poder volver a iniciar);
   * false desde la app (se quita la notificación).
   */
  fun reset(context: Context, keepNotification: Boolean): StopwatchState {
    RestAlarm.cancel(context)
    Haptics.play(context, Haptics.Kind.RESET)
    val s = get(context)
    return commit(
      context,
      StopwatchState(false, 0.0, 0.0, restEndsAt = 0.0, restDurationMs = s.restDurationMs),
      keepNotification,
    )
  }

  // MARK: - Descanso

  fun startRest(context: Context): StopwatchState {
    val s = get(context)
    val endsAt = System.currentTimeMillis() + s.restDurationMs.toLong()
    RestDoneAlert.cancel(context)
    RestAlarm.schedule(context, endsAt)
    Haptics.play(context, Haptics.Kind.START)
    return commit(context, s.copy(restEndsAt = endsAt.toDouble()))
  }

  /**
   * @param keepNotification true desde la pantalla de bloqueo (para poder iniciar otro descanso);
   * desde la app se quita la notificación si el cronómetro tampoco tiene tiempo.
   */
  fun cancelRest(context: Context, keepNotification: Boolean): StopwatchState {
    RestAlarm.cancel(context)
    Haptics.play(context, Haptics.Kind.STOP)
    val s = get(context)
    return commit(context, s.copy(restEndsAt = 0.0), keepNotification || s.hasContentWithoutRest())
  }

  /** Botón de la notificación. */
  fun toggleRest(context: Context): StopwatchState =
    if (get(context).isResting()) cancelRest(context, keepNotification = true) else startRest(context)

  /** Lo llama la alarma al terminar el descanso. */
  fun finishRest(context: Context): StopwatchState {
    val s = get(context)
    if (s.restEndsAt <= 0) return s
    val next = commit(context, s.copy(restEndsAt = 0.0))
    RestDoneAlert.show(context)
    return next
  }

  fun setRestDuration(context: Context, ms: Long): StopwatchState {
    val s = get(context)
    val next = s.copy(restDurationMs = ms.coerceIn(5_000L, 30 * 60_000L).toDouble())
    save(context, next)
    if (next.hasContent()) StopwatchNotification.show(context, next)
    return next
  }

  /** Limpia un descanso cuya alarma se perdió (p. ej. tras reiniciar el teléfono). */
  fun clearExpiredRest(context: Context): StopwatchState {
    val s = get(context)
    if (s.restEndsAt > 0 && !s.isResting()) {
      val next = s.copy(restEndsAt = 0.0)
      save(context, next)
      return next
    }
    return s
  }

  private fun StopwatchState.hasContentWithoutRest() = isRunning || elapsedMs() > 0
}
