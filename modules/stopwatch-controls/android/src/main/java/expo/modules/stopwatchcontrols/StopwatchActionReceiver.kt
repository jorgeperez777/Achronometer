package expo.modules.stopwatchcontrols

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/** Recibe los toques en los botones de la notificación (funciona aunque la app esté cerrada). */
class StopwatchActionReceiver : BroadcastReceiver() {
  companion object {
    const val ACTION_TOGGLE = "expo.modules.stopwatchcontrols.TOGGLE"
    const val ACTION_RESET = "expo.modules.stopwatchcontrols.RESET"
  }

  override fun onReceive(context: Context, intent: Intent) {
    when (intent.action) {
      ACTION_TOGGLE -> StopwatchStore.toggle(context)
      ACTION_RESET -> StopwatchStore.reset(context, keepNotification = true)
    }
  }
}
