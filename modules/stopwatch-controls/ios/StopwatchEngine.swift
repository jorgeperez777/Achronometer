import ActivityKit
import Foundation

/// Atributos de la Live Activity.
/// IMPORTANTE: debe ser idéntico (mismo nombre y campos) al de
/// `targets/widget/StopwatchAttributes.swift`; ActivityKit los empareja por nombre.
public struct StopwatchAttributes: ActivityAttributes {
  public struct ContentState: Codable, Hashable {
    public var isRunning: Bool
    /// Momento "virtual" en que habría empezado el cronómetro (ahora - transcurrido).
    public var startDate: Date
    /// Tiempo acumulado en segundos (se usa para mostrarlo cuando está en pausa).
    public var elapsed: Double
  }

  public var title: String
}

/// Estado del cronómetro. Es la única fuente de verdad: la app (JS) y los
/// botones de la pantalla de bloqueo leen y escriben aquí.
public struct StopwatchState {
  public var isRunning: Bool
  /// Epoch (ms) del inicio de la tanda actual. Solo es válido si isRunning.
  public var startedAt: Double
  /// Milisegundos acumulados de tandas anteriores.
  public var accumulatedMs: Double

  public func elapsedMs(now: Date = Date()) -> Double {
    accumulatedMs + (isRunning ? max(0, now.timeIntervalSince1970 * 1000 - startedAt) : 0)
  }
}

public final class StopwatchEngine {
  public static let shared = StopwatchEngine()
  public static let didChangeNotification = Notification.Name("StopwatchEngineDidChange")

  private let defaults = UserDefaults.standard
  private let key = "stopwatch.state.v1"

  private init() {}

  // MARK: - Estado

  public var state: StopwatchState {
    get {
      guard let dict = defaults.dictionary(forKey: key) else {
        return StopwatchState(isRunning: false, startedAt: 0, accumulatedMs: 0)
      }
      return StopwatchState(
        isRunning: dict["isRunning"] as? Bool ?? false,
        startedAt: dict["startedAt"] as? Double ?? 0,
        accumulatedMs: dict["accumulatedMs"] as? Double ?? 0
      )
    }
    set {
      defaults.set(
        [
          "isRunning": newValue.isRunning,
          "startedAt": newValue.startedAt,
          "accumulatedMs": newValue.accumulatedMs,
        ],
        forKey: key
      )
    }
  }

  // MARK: - Acciones

  /// Inicia o reanuda.
  public func start() async {
    var s = state
    guard !s.isRunning else { return }
    s.isRunning = true
    s.startedAt = Date().timeIntervalSince1970 * 1000
    state = s
    await syncActivity(createIfNeeded: true)
    notifyChange()
  }

  public func pause() async {
    var s = state
    guard s.isRunning else { return }
    s.accumulatedMs = s.elapsedMs()
    s.isRunning = false
    s.startedAt = 0
    state = s
    await syncActivity(createIfNeeded: false)
    notifyChange()
  }

  /// Pone el cronómetro en cero y detenido.
  /// - Parameter keepActivity: si es true (pantalla de bloqueo), la Live Activity
  ///   se mantiene para poder volver a iniciar desde ahí. Si es false (desde la app) se cierra.
  public func reset(keepActivity: Bool) async {
    state = StopwatchState(isRunning: false, startedAt: 0, accumulatedMs: 0)
    if keepActivity {
      await syncActivity(createIfNeeded: false)
    } else {
      await endActivities()
    }
    notifyChange()
  }

  public func toggle() async {
    if state.isRunning { await pause() } else { await start() }
  }

  // MARK: - Live Activity

  private func contentState() -> StopwatchAttributes.ContentState {
    let s = state
    let elapsedSec = s.elapsedMs() / 1000
    return StopwatchAttributes.ContentState(
      isRunning: s.isRunning,
      startDate: Date().addingTimeInterval(-elapsedSec),
      elapsed: elapsedSec
    )
  }

  private func syncActivity(createIfNeeded: Bool) async {
    // El widget con botones interactivos requiere iOS 17.
    guard #available(iOS 17.0, *) else { return }
    let content = ActivityContent(state: contentState(), staleDate: nil)
    let activities = Activity<StopwatchAttributes>.activities

    if activities.isEmpty {
      guard createIfNeeded, ActivityAuthorizationInfo().areActivitiesEnabled else { return }
      do {
        _ = try Activity.request(
          attributes: StopwatchAttributes(title: "Cronómetro"),
          content: content,
          pushType: nil
        )
      } catch {
        print("[Stopwatch] No se pudo iniciar la Live Activity: \(error)")
      }
    } else {
      for activity in activities {
        await activity.update(content)
      }
    }
  }

  public func endActivities() async {
    guard #available(iOS 16.2, *) else { return }
    for activity in Activity<StopwatchAttributes>.activities {
      await activity.end(nil, dismissalPolicy: .immediate)
    }
  }

  private func notifyChange() {
    DispatchQueue.main.async {
      NotificationCenter.default.post(name: StopwatchEngine.didChangeNotification, object: nil)
    }
  }
}
