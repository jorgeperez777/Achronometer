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

struct StopwatchLiveActivity: Widget {
  var body: some WidgetConfiguration {
    ActivityConfiguration(for: StopwatchAttributes.self) { context in
      LockScreenView(state: context.state)
        .activityBackgroundTint(Color.black.opacity(0.85))
        .activitySystemActionForegroundColor(.white)
    } dynamicIsland: { context in
      DynamicIsland {
        DynamicIslandExpandedRegion(.leading) {
          Label("Cronómetro", systemImage: "stopwatch")
            .font(.caption)
            .foregroundStyle(.secondary)
            .padding(.leading, 4)
        }
        DynamicIslandExpandedRegion(.bottom) {
          HStack(alignment: .center) {
            TimeText(state: context.state)
              .font(.system(size: 40, weight: .semibold, design: .rounded))
              .monospacedDigit()
            Spacer()
            ControlButtons(state: context.state)
          }
          .padding(.horizontal, 4)
        }
      } compactLeading: {
        Image(systemName: context.state.isRunning ? "stopwatch" : "pause.circle")
          .foregroundStyle(Color.accentColor)
      } compactTrailing: {
        TimeText(state: context.state)
          .monospacedDigit()
          .frame(maxWidth: 56)
      } minimal: {
        Image(systemName: "stopwatch")
          .foregroundStyle(Color.accentColor)
      }
    }
  }
}

// MARK: - Vistas

private struct LockScreenView: View {
  let state: StopwatchAttributes.ContentState

  var body: some View {
    HStack(alignment: .center, spacing: 12) {
      VStack(alignment: .leading, spacing: 2) {
        Label(statusLabel, systemImage: "stopwatch")
          .font(.caption)
          .foregroundStyle(.white.opacity(0.7))
        TimeText(state: state)
          .font(.system(size: 44, weight: .semibold, design: .rounded))
          .monospacedDigit()
          .foregroundStyle(.white)
      }
      Spacer()
      ControlButtons(state: state)
    }
    .padding(16)
  }

  private var statusLabel: String {
    if state.isRunning { return "En marcha" }
    return state.elapsed > 0 ? "En pausa" : "Detenido"
  }
}

private struct ControlButtons: View {
  let state: StopwatchAttributes.ContentState

  var body: some View {
    HStack(spacing: 10) {
      Button(intent: ResetStopwatchIntent()) {
        Image(systemName: "arrow.counterclockwise")
          .font(.title3.weight(.semibold))
          .frame(width: 48, height: 48)
          .background(Circle().fill(Color.white.opacity(0.18)))
          .foregroundStyle(.white)
      }
      .buttonStyle(.plain)
      .disabled(!state.isRunning && state.elapsed == 0)

      Button(intent: ToggleStopwatchIntent()) {
        Image(systemName: state.isRunning ? "pause.fill" : "play.fill")
          .font(.title3.weight(.semibold))
          .frame(width: 48, height: 48)
          .background(Circle().fill(state.isRunning ? Color.orange : Color.green))
          .foregroundStyle(.black)
      }
      .buttonStyle(.plain)
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
