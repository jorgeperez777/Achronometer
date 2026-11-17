import AppIntents
import Foundation

// Este archivo se compila en la app Y en el widget (carpeta _shared).
// Los LiveActivityIntent se ejecutan en el proceso de la app (iOS la despierta
// en segundo plano), por eso ahí sí está disponible el módulo StopwatchControls.
#if canImport(StopwatchControls)
internal import StopwatchControls
#endif

@available(iOS 17.0, *)
struct ToggleStopwatchIntent: LiveActivityIntent {
  static let title: LocalizedStringResource = "Start or pause the stopwatch"

  init() {}

  func perform() async throws -> some IntentResult {
    #if canImport(StopwatchControls)
    await StopwatchEngine.shared.toggle()
    #endif
    return .result()
  }
}

@available(iOS 17.0, *)
struct ResetStopwatchIntent: LiveActivityIntent {
  static let title: LocalizedStringResource = "Reset the stopwatch"

  init() {}

  func perform() async throws -> some IntentResult {
    #if canImport(StopwatchControls)
    await StopwatchEngine.shared.reset(keepActivity: true)
    #endif
    return .result()
  }
}

/// Botón azul: igual que el botón principal de la app (descansar / saltar descanso /
/// terminé la serie / siguiente ejercicio). Ver `StopwatchEngine.restButton`.
@available(iOS 17.0, *)
struct RestButtonIntent: LiveActivityIntent {
  static let title: LocalizedStringResource = "Rest or finish the set"

  init() {}

  func perform() async throws -> some IntentResult {
    #if canImport(StopwatchControls)
    await StopwatchEngine.shared.restButton()
    #endif
    return .result()
  }
}
