package expo.modules.stopwatchcontrols

import android.content.Context
import android.os.Bundle

/** Pestaña abierta en la app. Decide qué hace el botón ⏳/✓ de la notificación. */
enum class Mode { STOPWATCH, REST, SERIES }

/** Estado del cronómetro + descanso + series. Única fuente de verdad para la app y la notificación. */
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
  /** Series hechas del ejercicio actual. */
  val sets: Int = 0,
  /** Series objetivo del ejercicio. */
  val setsTarget: Int = StopwatchStore.DEFAULT_SETS_TARGET,
  val mode: Mode = Mode.STOPWATCH,
) {
  fun elapsedMs(now: Long = System.currentTimeMillis()): Long =
    (accumulatedMs + if (isRunning) maxOf(0.0, now - startedAt) else 0.0).toLong()

  /** Milisegundos de descanso que quedan; 0 si no hay descanso en curso. */
  fun restRemainingMs(now: Long = System.currentTimeMillis()): Long =
    if (restEndsAt > 0) maxOf(0L, restEndsAt.toLong() - now) else 0L

  fun isResting(now: Long = System.currentTimeMillis()): Boolean = restRemainingMs(now) > 0

  /** Se hicieron todas las series del ejercicio. */
  val exerciseDone: Boolean get() = sets >= setsTarget

  /**
   * Hay algo que mostrar en la notificación. En modo series siempre: es el modo pensado para
   * llevar las series desde la pantalla de bloqueo, desde la primera.
   */
  fun hasContent(): Boolean = isRunning || elapsedMs() > 0 || isResting() || mode == Mode.SERIES

  fun toBundle(): Bundle = Bundle().apply {
    putBoolean("isRunning", isRunning)
    putDouble("startedAt", startedAt)
    putDouble("accumulatedMs", accumulatedMs)
    putDouble("restEndsAt", restEndsAt)
    putDouble("restDurationMs", restDurationMs)
    putInt("sets", sets)
    putInt("setsTarget", setsTarget)
    putString("mode", mode.name.lowercase())
  }
}

object StopwatchStore {
  const val DEFAULT_REST_MS = 90_000L
  const val DEFAULT_SETS_TARGET = 4
  private const val PREFS = "stopwatch_controls"
  private val listeners = mutableSetOf<(StopwatchState) -> Unit>()

  fun addListener(l: (StopwatchState) -> Unit) = synchronized(listeners) { listeners.add(l) }
  fun removeListener(l: (StopwatchState) -> Unit) = synchronized(listeners) { listeners.remove(l) }

  fun get(context: Context): StopwatchState {
    val p = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    val target = p.getInt("setsTarget", DEFAULT_SETS_TARGET)
    return StopwatchState(
      isRunning = p.getBoolean("isRunning", false),
      startedAt = p.getLong("startedAt", 0L).toDouble(),
      accumulatedMs = p.getLong("accumulatedMs", 0L).toDouble(),
      restEndsAt = p.getLong("restEndsAt", 0L).toDouble(),
      restDurationMs = p.getLong("restDurationMs", DEFAULT_REST_MS).toDouble(),
      sets = p.getInt("sets", 0).coerceIn(0, target),
      setsTarget = target,
      mode = runCatching { Mode.valueOf(p.getString("mode", null) ?: "") }.getOrDefault(Mode.STOPWATCH),
    )
  }

  private fun save(context: Context, s: StopwatchState) {
    context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit()
      .putBoolean("isRunning", s.isRunning)
      .putLong("startedAt", s.startedAt.toLong())
      .putLong("accumulatedMs", s.accumulatedMs.toLong())
      .putLong("restEndsAt", s.restEndsAt.toLong())
      .putLong("restDurationMs", s.restDurationMs.toLong())
      .putInt("sets", s.sets)
      .putInt("setsTarget", s.setsTarget)
      .putString("mode", s.mode.name)
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

  /** Guarda sin forzar la notificación: solo la actualiza si ya tiene algo que mostrar. */
  private fun update(context: Context, s: StopwatchState): StopwatchState {
    save(context, s)
    if (s.hasContent()) StopwatchNotification.show(context, s) else StopwatchNotification.cancel(context)
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
   * Pone el cronómetro a 0. **No toca el descanso ni las series**: son independientes.
   * @param keepNotification true desde la pantalla de bloqueo (para poder volver a iniciar);
   * false desde la app (se quita la notificación si no queda nada en marcha).
   */
  fun reset(context: Context, keepNotification: Boolean): StopwatchState {
    Haptics.play(context, Haptics.Kind.RESET)
    val s = get(context)
    return commit(context, s.copy(isRunning = false, startedAt = 0.0, accumulatedMs = 0.0), keepNotification)
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
   * desde la app se quita la notificación si no queda nada en marcha.
   */
  fun cancelRest(context: Context, keepNotification: Boolean): StopwatchState {
    RestAlarm.cancel(context)
    Haptics.play(context, Haptics.Kind.STOP)
    val s = get(context).copy(restEndsAt = 0.0)
    return commit(context, s, keepNotification || s.hasContent())
  }

  /**
   * Botón ⏳/✓ de la notificación. Hace lo mismo que la pestaña abierta en la app:
   * en Series marca la serie; en el resto, inicia/cancela un descanso.
   */
  fun notificationRestButton(context: Context): StopwatchState {
    val s = get(context)
    return when {
      s.isResting() -> cancelRest(context, keepNotification = true)
      s.mode == Mode.SERIES -> completeSet(context)
      else -> startRest(context)
    }
  }

  /** Lo llama la alarma al terminar el descanso. */
  fun finishRest(context: Context): StopwatchState {
    val s = get(context)
    if (s.restEndsAt <= 0) return s
    val next = commit(context, s.copy(restEndsAt = 0.0))
    if (next.mode == Mode.SERIES && next.sets > 0) {
      RestDoneAlert.show(context, "¡Descanso terminado!", "Serie ${next.sets + 1} de ${next.setsTarget}")
    } else {
      RestDoneAlert.show(context, "¡Descanso terminado!", "A por la siguiente serie")
    }
    return next
  }

  fun setRestDuration(context: Context, ms: Long): StopwatchState =
    update(context, get(context).copy(restDurationMs = ms.coerceIn(5_000L, 30 * 60_000L).toDouble()))

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

  // MARK: - Series

  /**
   * "Serie hecha". Si no era la última, arranca el descanso. Si era la última, avisa de que el
   * ejercicio está completo (sin descanso). Con el ejercicio ya completo, empieza el siguiente.
   */
  fun completeSet(context: Context): StopwatchState {
    val s = get(context)
    if (s.exerciseDone) return nextExercise(context)

    val next = s.copy(sets = s.sets + 1)
    if (!next.exerciseDone) {
      save(context, next)
      return startRest(context) // vibra y publica la notificación
    }

    // Última serie: sin descanso.
    RestAlarm.cancel(context)
    Haptics.play(context, Haptics.Kind.DONE)
    val done = commit(context, next.copy(restEndsAt = 0.0))
    RestDoneAlert.show(context, "¡Ejercicio completado!", "${next.setsTarget} de ${next.setsTarget} series")
    return done
  }

  /** Deshace la última serie (toque por error). Si había arrancado un descanso, lo cancela. */
  fun undoSet(context: Context): StopwatchState {
    val s = get(context)
    if (s.sets == 0) return s
    if (s.isResting()) RestAlarm.cancel(context)
    RestDoneAlert.cancel(context)
    Haptics.play(context, Haptics.Kind.STOP)
    return update(context, s.copy(sets = s.sets - 1, restEndsAt = 0.0))
  }

  /** Empieza el siguiente ejercicio: series a 0 (no toca cronómetro ni descanso). */
  fun nextExercise(context: Context): StopwatchState {
    RestDoneAlert.cancel(context)
    Haptics.play(context, Haptics.Kind.RESET)
    return update(context, get(context).copy(sets = 0))
  }

  fun setSetsTarget(context: Context, target: Int): StopwatchState {
    val s = get(context)
    // No se puede bajar por debajo de las ya hechas.
    return update(context, s.copy(setsTarget = target.coerceIn(maxOf(1, s.sets), 20)))
  }

  /** La app avisa de qué pestaña está abierta. */
  fun setMode(context: Context, mode: Mode): StopwatchState {
    val s = get(context)
    if (s.mode == mode) return s
    return update(context, s.copy(mode = mode))
  }
}
