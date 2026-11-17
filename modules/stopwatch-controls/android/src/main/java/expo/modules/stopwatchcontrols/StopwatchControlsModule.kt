package expo.modules.stopwatchcontrols

import android.content.Context
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class StopwatchControlsModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  private val listener: (StopwatchState) -> Unit = { state ->
    sendEvent("onChange", state.toBundle())
  }

  override fun definition() = ModuleDefinition {
    Name("StopwatchControls")

    Events("onChange")

    OnStartObserving { StopwatchStore.addListener(listener) }
    OnStopObserving { StopwatchStore.removeListener(listener) }

    Function("getState") { StopwatchStore.get(context).toBundle() }

    AsyncFunction("start") { StopwatchStore.start(context).toBundle() }
    AsyncFunction("pause") { StopwatchStore.pause(context).toBundle() }
    AsyncFunction("reset") { StopwatchStore.reset(context, keepNotification = false).toBundle() }

    AsyncFunction("startRest") { StopwatchStore.startRest(context).toBundle() }
    AsyncFunction("cancelRest") { StopwatchStore.cancelRest(context, keepNotification = false).toBundle() }
    AsyncFunction("setRestDuration") { ms: Double -> StopwatchStore.setRestDuration(context, ms.toLong()).toBundle() }

    AsyncFunction("startExercise") { StopwatchStore.startExercise(context).toBundle() }
    AsyncFunction("completeSet") { StopwatchStore.completeSet(context).toBundle() }
    AsyncFunction("undoSet") { StopwatchStore.undoSet(context).toBundle() }
    AsyncFunction("endExercise") { StopwatchStore.endExercise(context).toBundle() }
    AsyncFunction("setSetsTarget") { target: Int -> StopwatchStore.setSetsTarget(context, target).toBundle() }
    AsyncFunction("setMode") { mode: String ->
      val m = runCatching { Mode.valueOf(mode.uppercase()) }.getOrDefault(Mode.STOPWATCH)
      StopwatchStore.setMode(context, m).toBundle()
    }

    /** Vuelve a publicar la notificación (p. ej. después de conceder el permiso o reiniciar el teléfono). */
    Function("refreshNotification") {
      val s = StopwatchStore.clearExpiredRest(context)
      if (s.hasContent()) StopwatchNotification.show(context, s)
    }
  }
}
