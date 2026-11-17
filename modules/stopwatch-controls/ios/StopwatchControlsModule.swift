import ExpoModulesCore
import UserNotifications

public class StopwatchControlsModule: Module {
  private var observer: NSObjectProtocol?

  public func definition() -> ModuleDefinition {
    Name("StopwatchControls")

    Events("onChange")

    OnCreate {
      // Para ver el aviso de fin de descanso también con la app abierta.
      let center = UNUserNotificationCenter.current()
      if center.delegate == nil { center.delegate = ForegroundNotificationPresenter.shared }
    }

    OnStartObserving {
      self.observer = NotificationCenter.default.addObserver(
        forName: StopwatchEngine.didChangeNotification, object: nil, queue: .main
      ) { [weak self] _ in
        self?.sendEvent("onChange", Self.serialize(StopwatchEngine.shared.state))
      }
    }

    OnStopObserving {
      if let observer = self.observer {
        NotificationCenter.default.removeObserver(observer)
      }
      self.observer = nil
    }

    Function("getState") {
      Self.serialize(StopwatchEngine.shared.clearExpiredRest())
    }

    AsyncFunction("start") { () async -> [String: Any] in
      await StopwatchEngine.shared.start()
      return Self.current()
    }
    AsyncFunction("pause") { () async -> [String: Any] in
      await StopwatchEngine.shared.pause()
      return Self.current()
    }
    AsyncFunction("reset") { () async -> [String: Any] in
      await StopwatchEngine.shared.reset(keepActivity: false)
      return Self.current()
    }

    AsyncFunction("startRest") { () async -> [String: Any] in
      await StopwatchEngine.shared.startRest()
      return Self.current()
    }
    AsyncFunction("cancelRest") { () async -> [String: Any] in
      await StopwatchEngine.shared.cancelRest(keepActivity: false)
      return Self.current()
    }
    AsyncFunction("setRestDuration") { (ms: Double) async -> [String: Any] in
      await StopwatchEngine.shared.setRestDuration(ms)
      return Self.current()
    }

    AsyncFunction("startExercise") { () async -> [String: Any] in
      await StopwatchEngine.shared.startExercise()
      return Self.current()
    }
    AsyncFunction("completeSet") { () async -> [String: Any] in
      await StopwatchEngine.shared.completeSet()
      return Self.current()
    }
    AsyncFunction("undoSet") { () async -> [String: Any] in
      await StopwatchEngine.shared.undoSet()
      return Self.current()
    }
    AsyncFunction("endExercise") { () async -> [String: Any] in
      await StopwatchEngine.shared.endExercise()
      return Self.current()
    }
    AsyncFunction("setSetsTarget") { (target: Int) async -> [String: Any] in
      await StopwatchEngine.shared.setSetsTarget(target)
      return Self.current()
    }
    AsyncFunction("setMode") { (mode: String) async -> [String: Any] in
      await StopwatchEngine.shared.setMode(AppMode(rawValue: mode) ?? .stopwatch)
      return Self.current()
    }

    /// Listas editables de duraciones de descanso (ms) y de series.
    Function("getPresets") { Self.presets() }
    AsyncFunction("setPresets") { (rest: [Double], sets: [Int]) -> [String: Any] in
      StopwatchEngine.shared.setPresets(rest: rest, sets: sets)
      return Self.presets()
    }

    /// Ajustes: idioma ("system"/"es"/"en"), vibración al tocar, vibración y sonido del aviso.
    Function("getSettings") { Settings.toDictionary() }
    AsyncFunction("setSettings") { (values: [String: Any]) async -> [String: Any] in
      Settings.update(values)
      await StopwatchEngine.shared.settingsChanged()
      return Settings.toDictionary()
    }

    /// Vuelve a mostrar la Live Activity si hay algo en marcha (al abrir la app / volver a primer plano).
    Function("refreshNotification") {
      Task { await StopwatchEngine.shared.refresh() }
    }
  }

  static func current() -> [String: Any] { serialize(StopwatchEngine.shared.state) }

  static func presets() -> [String: Any] {
    ["rest": StopwatchEngine.shared.restPresets, "sets": StopwatchEngine.shared.setsPresets]
  }

  static func serialize(_ s: StopwatchState) -> [String: Any] {
    [
      "isRunning": s.isRunning,
      "startedAt": s.startedAt,
      "accumulatedMs": s.accumulatedMs,
      "restEndsAt": s.restEndsAt,
      "restDurationMs": s.restDurationMs,
      "exerciseActive": s.exerciseActive,
      "sets": s.sets,
      "setsTarget": s.setsTarget,
      "mode": s.mode.rawValue,
    ]
  }
}
