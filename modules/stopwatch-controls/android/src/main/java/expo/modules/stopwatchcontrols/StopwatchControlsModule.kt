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

    /** Vuelve a publicar la notificación (p. ej. después de conceder el permiso). */
    Function("refreshNotification") {
      val s = StopwatchStore.get(context)
      if (s.isRunning || s.elapsedMs() > 0) StopwatchNotification.show(context, s)
    }
  }
}
