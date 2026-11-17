import ActivityKit
import AppIntents
import SwiftUI
import WidgetKit

@main
struct StopwatchWidgetBundle: WidgetBundle {
  var body: some Widget {
    StopwatchLiveActivity()
  }
}

private let restBlue = Color(red: 10 / 255, green: 132 / 255, blue: 1)
private let startGreen = Color(red: 48 / 255, green: 209 / 255, blue: 88 / 255)
private let pauseOrange = Color(red: 1, green: 159 / 255, blue: 10 / 255)

struct StopwatchLiveActivity: Widget {
  var body: some WidgetConfiguration {
    ActivityConfiguration(for: StopwatchAttributes.self) { context in
      LockScreenView(m: Model(context.state, stale: context.isStale))
        .activityBackgroundTint(Color.black.opacity(0.85))
        .activitySystemActionForegroundColor(.white)
    } dynamicIsland: { context in
      let m = Model(context.state, stale: context.isStale)
      return DynamicIsland {
        DynamicIslandExpandedRegion(.leading) {
          Label(m.status, systemImage: m.resting ? "hourglass" : "stopwatch")
            .font(.caption)
            .foregroundStyle(m.resting ? restBlue : .secondary)
            .padding(.leading, 4)
        }
        DynamicIslandExpandedRegion(.trailing) {
          if m.resting { RestCountdown(m: m).font(.caption.weight(.semibold)).padding(.trailing, 4) }
        }
        DynamicIslandExpandedRegion(.bottom) {
          HStack(alignment: .center) {
            MainText(m: m)
              .font(.system(size: 36, weight: .semibold, design: .rounded))
              .monospacedDigit()
            Spacer()
            ControlButtons(m: m)
          }
          .padding(.horizontal, 4)
        }
      } compactLeading: {
        Image(systemName: m.resting ? "hourglass" : (m.state.isRunning ? "stopwatch" : "pause.circle"))
          .foregroundStyle(m.resting ? restBlue : Color.accentColor)
      } compactTrailing: {
        Group {
          if m.resting { RestCountdown(m: m) } else { MainText(m: m) }
        }
        .monospacedDigit()
        .frame(maxWidth: 56)
      } minimal: {
        Image(systemName: m.resting ? "hourglass" : "stopwatch")
          .foregroundStyle(m.resting ? restBlue : Color.accentColor)
      }
    }
  }
}

// MARK: - Modelo (misma lógica que la notificación de Android)

private struct Model {
  let state: StopwatchAttributes.ContentState
  /// El descanso terminó (staleDate = fin del descanso) o su hora ya pasó.
  let resting: Bool

  init(_ state: StopwatchAttributes.ContentState, stale: Bool) {
    self.state = state
    if let end = state.restEnd, !stale, end > Date() { resting = true } else { resting = false }
  }

  var es: Bool { state.lang == "es" }
  var stopwatchUsed: Bool { state.isRunning || state.elapsed > 0 }
  var exerciseDone: Bool { state.sets >= state.setsTarget }
  /// Con un ejercicio en marcha y el cronómetro sin usar, la línea grande muestra "2/4".
  var showProgress: Bool { state.series && !stopwatchUsed }
  var progress: String { "\(min(state.sets + 1, state.setsTarget))/\(state.setsTarget)" }

  var status: String {
    if resting { return es ? "Descanso" : "Rest" }
    if state.series && exerciseDone {
      let done = es ? "Completado" : "Done"
      return showProgress ? done : "\(done) \(progress)"
    }
    if state.series {
      let set = es ? "Serie" : "Set"
      return showProgress ? set : "\(set) \(progress)"
    }
    if state.isRunning { return es ? "En marcha" : "Running" }
    return state.elapsed > 0 ? (es ? "En pausa" : "Paused") : (es ? "Detenido" : "Stopped")
  }

  /// Icono y etiqueta del botón azul (ver `StopwatchEngine.restButton`).
  var restButton: (icon: String, label: String) {
    if resting { return ("xmark", es ? "Saltar descanso" : "Skip rest") }
    if state.series && exerciseDone { return ("forward.end.fill", es ? "Siguiente ejercicio" : "Next exercise") }
    if state.series {
      return ("checkmark", es ? "Terminé la serie \(state.sets + 1)" : "Finished set \(state.sets + 1)")
    }
    return ("hourglass", es ? "Descansar" : "Rest")
  }
}

// MARK: - Vistas

private struct LockScreenView: View {
  let m: Model

  var body: some View {
    HStack(alignment: .center, spacing: 10) {
      VStack(alignment: .leading, spacing: 2) {
        HStack(spacing: 8) {
          Label(m.status, systemImage: m.resting ? "hourglass" : "stopwatch")
            .font(.caption)
            .foregroundStyle(m.resting ? restBlue : .white.opacity(0.7))
          if m.resting {
            RestCountdown(m: m)
              .font(.caption.weight(.semibold))
              .foregroundStyle(restBlue)
          }
        }
        MainText(m: m)
          .font(.system(size: 40, weight: .semibold, design: .rounded))
          .monospacedDigit()
          .foregroundStyle(.white)
          .lineLimit(1)
          .minimumScaleFactor(0.6)
      }
      Spacer(minLength: 0)
      ControlButtons(m: m)
    }
    .padding(16)
  }
}

private struct ControlButtons: View {
  let m: Model

  var body: some View {
    HStack(spacing: 8) {
      if m.stopwatchUsed {
        Button(intent: ResetStopwatchIntent()) {
          circle("arrow.counterclockwise", fill: Color.white.opacity(0.18), fg: .white)
        }
        .buttonStyle(.plain)
        .accessibilityLabel(m.es ? "Reiniciar cronómetro" : "Reset stopwatch")
      }

      Button(intent: ToggleStopwatchIntent()) {
        circle(m.state.isRunning ? "pause.fill" : "play.fill", fill: m.state.isRunning ? pauseOrange : startGreen, fg: .black)
      }
      .buttonStyle(.plain)
      .accessibilityLabel(m.state.isRunning ? (m.es ? "Pausar" : "Pause") : (m.es ? "Iniciar" : "Start"))

      Button(intent: RestButtonIntent()) {
        circle(m.restButton.icon, fill: m.resting ? restBlue : restBlue.opacity(0.3), fg: m.resting ? .white : restBlue)
      }
      .buttonStyle(.plain)
      .accessibilityLabel(m.restButton.label)
    }
  }

  private func circle(_ icon: String, fill: Color, fg: Color) -> some View {
    Image(systemName: icon)
      .font(.title3.weight(.semibold))
      .frame(width: 46, height: 46)
      .background(Circle().fill(fill))
      .foregroundStyle(fg)
  }
}

/// Línea grande: el tiempo del cronómetro o, con un ejercicio sin cronómetro, el progreso.
private struct MainText: View {
  let m: Model

  var body: some View {
    if m.showProgress {
      Text(m.progress)
    } else {
      TimeText(state: m.state)
    }
  }
}

/// Cuenta atrás del descanso; la anima el sistema sin despertar la app.
private struct RestCountdown: View {
  let m: Model

  var body: some View {
    if let start = m.state.restStart, let end = m.state.restEnd, m.resting {
      Text(timerInterval: start...end, countsDown: true)
        .monospacedDigit()
        .multilineTextAlignment(.trailing)
        .frame(maxWidth: 56, alignment: .leading)
        .foregroundStyle(restBlue)
    }
  }
}

/// Si está en marcha, el sistema actualiza el texto solo (sin despertar la app).
/// Si está en pausa, se muestra el tiempo fijo.
private struct TimeText: View {
  let state: StopwatchAttributes.ContentState

  var body: some View {
    if state.isRunning {
      Text(timerInterval: state.startDate...Date.distantFuture, countsDown: false)
    } else {
      Text(Self.format(state.elapsed))
    }
  }

  static func format(_ seconds: Double) -> String {
    let total = Int(seconds)
    let h = total / 3600
    let m = (total % 3600) / 60
    let s = total % 60
    return h > 0
      ? String(format: "%d:%02d:%02d", h, m, s)
      : String(format: "%d:%02d", m, s)
  }
}
