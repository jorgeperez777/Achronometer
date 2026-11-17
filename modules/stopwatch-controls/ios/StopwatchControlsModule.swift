import ExpoModulesCore

public class StopwatchControlsModule: Module {
  private var observer: NSObjectProtocol?

  public func definition() -> ModuleDefinition {
    Name("StopwatchControls")

    Events("onChange")

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
      Self.serialize(StopwatchEngine.shared.state)
    }

    AsyncFunction("start") {
      await StopwatchEngine.shared.start()
      return Self.serialize(StopwatchEngine.shared.state)
    }

    AsyncFunction("pause") {
      await StopwatchEngine.shared.pause()
      return Self.serialize(StopwatchEngine.shared.state)
    }

    AsyncFunction("reset") {
      await StopwatchEngine.shared.reset(keepActivity: false)
      return Self.serialize(StopwatchEngine.shared.state)
    }
  }

  static func serialize(_ s: StopwatchState) -> [String: Any] {
    [
      "isRunning": s.isRunning,
      "startedAt": s.startedAt,
      "accumulatedMs": s.accumulatedMs,
    ]
  }
}
