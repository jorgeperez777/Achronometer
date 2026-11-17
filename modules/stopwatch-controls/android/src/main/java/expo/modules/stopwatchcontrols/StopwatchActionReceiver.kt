package expo.modules.stopwatchcontrols

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/**
 * Recibe los toques en los botones de la notificación y la alarma de fin de descanso
 * (funciona aunque la app esté cerrada).
 */
class StopwatchActionReceiver : BroadcastReceiver() {
  companion object {
    const val ACTION_TOGGLE = "expo.modules.stopwatchcontrols.TOGGLE"
    const val ACTION_RESET = "expo.modules.stopwatchcontrols.RESET"
    const val ACTION_REST = "expo.modules.stopwatchcontrols.REST"
    const val ACTION_REST_DONE = "expo.modules.stopwatchcontrols.REST_DONE"
    /** El usuario quitó la notificación (Android 14+ lo permite con el teléfono desbloqueado). */
    const val ACTION_DISMISSED = "expo.modules.stopwatchcontrols.DISMISSED"
  }

  override fun onReceive(context: Context, intent: Intent) {
    when (intent.action) {
      ACTION_TOGGLE -> StopwatchStore.toggle(context)
      ACTION_RESET -> StopwatchStore.reset(context, keepNotification = true)
      ACTION_REST -> StopwatchStore.notificationRestButton(context)
      ACTION_REST_DONE -> StopwatchStore.finishRest(context)
      ACTION_DISMISSED -> StopwatchStore.restoreNotification(context)
    }
  }
}
