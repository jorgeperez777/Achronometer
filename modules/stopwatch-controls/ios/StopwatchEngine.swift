import ActivityKit
import AudioToolbox
import Foundation
import UIKit
import UserNotifications

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
    /// Descanso en curso (nil = sin descanso). El widget anima la cuenta atrás solo.
    public var restStart: Date?
    public var restEnd: Date?
    /// Pestaña Series abierta con un ejercicio en marcha: el botón azul marca series.
    public var series: Bool
    public var sets: Int
    public var setsTarget: Int
    /// Idioma ya resuelto ("es" / "en"): el widget no puede leer los ajustes de la app.
    public var lang: String
  }

  public var title: String
}

public enum AppMode: String {
  case stopwatch, rest, series
}

/// Estado del cronómetro + descanso + series. Es la única fuente de verdad: la app (JS) y los
/// botones de la pantalla de bloqueo leen y escriben aquí. Misma lógica que `StopwatchStore.kt`.
public struct StopwatchState {
  public var isRunning = false
  /// Epoch (ms) del inicio de la tanda actual. Solo es válido si isRunning.
  public var startedAt: Double = 0
  /// Milisegundos acumulados de tandas anteriores.
  public var accumulatedMs: Double = 0
  /// Epoch (ms) en que termina el descanso en curso; 0 = sin descanso.
  public var restEndsAt: Double = 0
  public var restDurationMs: Double = StopwatchEngine.defaultRestMs
  /// Hay un ejercicio en marcha en la pestaña Series (false = configurando).
  public var exerciseActive = false
  public var sets = 0
  public var setsTarget = StopwatchEngine.defaultSetsTarget
  public var mode: AppMode = .stopwatch

  public static func nowMs() -> Double { Date().timeIntervalSince1970 * 1000 }

  public func elapsedMs(now: Double = nowMs()) -> Double {
    accumulatedMs + (isRunning ? max(0, now - startedAt) : 0)
  }

  public func restRemainingMs(now: Double = nowMs()) -> Double {
    restEndsAt > 0 ? max(0, restEndsAt - now) : 0
  }

  public var isResting: Bool { restRemainingMs() > 0 }
  public var exerciseDone: Bool { sets >= setsTarget }
  /// La Live Activity controla las series (pestaña Series abierta y ejercicio en marcha).
  public var seriesControls: Bool { mode == .series && exerciseActive }
  /// Hay algo que mostrar en la Live Activity.
  public var hasContent: Bool { isRunning || elapsedMs() > 0 || isResting || seriesControls }
}

public final class StopwatchEngine {
  public static let shared = StopwatchEngine()
  public static let didChangeNotification = Notification.Name("StopwatchEngineDidChange")

  static let defaultRestMs: Double = 90_000
  static let defaultSetsTarget = 4
  static let defaultRestPresets: [Double] = [60_000, 90_000, 120_000, 180_000]
  static let defaultSetsPresets = [3, 4, 5, 6]
  static let maxPresets = 8
  static let minRestMs: Double = 5_000
  static let maxRestMs: Double = 30 * 60_000
  static let minSets = 1
  static let maxSets = 20

  private let defaults = UserDefaults.standard
  private let key = "stopwatch.state.v1"
  private let restAlertId = "achro.rest_done"
  /// Mientras la app está viva, limpia el descanso al terminar (con la app suspendida lo
  /// hace `clearExpiredRest` al volver; el aviso es una notificación local programada).
  private var restWorkItem: DispatchWorkItem?

  private init() {}

  // MARK: - Estado

  public var state: StopwatchState {
    get {
      guard let d = defaults.dictionary(forKey: key) else { return StopwatchState() }
      var s = StopwatchState()
      s.isRunning = d["isRunning"] as? Bool ?? false
      s.startedAt = d["startedAt"] as? Double ?? 0
      s.accumulatedMs = d["accumulatedMs"] as? Double ?? 0
      s.restEndsAt = d["restEndsAt"] as? Double ?? 0
      s.restDurationMs = d["restDurationMs"] as? Double ?? Self.defaultRestMs
      s.exerciseActive = d["exerciseActive"] as? Bool ?? false
      s.setsTarget = d["setsTarget"] as? Int ?? Self.defaultSetsTarget
      s.sets = min(max(0, d["sets"] as? Int ?? 0), s.setsTarget)
      s.mode = AppMode(rawValue: d["mode"] as? String ?? "") ?? .stopwatch
      return s
    }
    set {
      defaults.set(
        [
          "isRunning": newValue.isRunning,
          "startedAt": newValue.startedAt,
          "accumulatedMs": newValue.accumulatedMs,
          "restEndsAt": newValue.restEndsAt,
          "restDurationMs": newValue.restDurationMs,
          "exerciseActive": newValue.exerciseActive,
          "sets": newValue.sets,
          "setsTarget": newValue.setsTarget,
          "mode": newValue.mode.rawValue,
        ] as [String: Any],
        forKey: key
      )
    }
  }

  /// Guarda y refleja en la Live Activity. `keep`: mostrarla aunque no haya nada en marcha
  /// (p. ej. reiniciar desde la pantalla de bloqueo, para poder volver a iniciar desde ahí).
  private func commit(_ s: StopwatchState, keep: Bool) async {
    state = s
    if keep || s.hasContent {
      await syncActivity(createIfNeeded: true)
    } else {
      await endActivities()
    }
    notifyChange()
  }

  // MARK: - Cronómetro

  /// Inicia o reanuda.
  public func start() async {
    var s = state
    guard !s.isRunning else { return }
    Haptics.play(.start)
    s.isRunning = true
    s.startedAt = StopwatchState.nowMs()
    await commit(s, keep: true)
  }

  public func pause() async {
    var s = state
    guard s.isRunning else { return }
    Haptics.play(.stop)
    s.accumulatedMs = s.elapsedMs()
    s.isRunning = false
    s.startedAt = 0
    await commit(s, keep: true)
  }

  /// Pone el cronómetro en cero. **No toca el descanso ni las series** (son independientes).
  /// - Parameter keepActivity: true desde la pantalla de bloqueo (para poder volver a iniciar
  ///   desde ahí); false desde la app (se quita si no queda nada en marcha).
  public func reset(keepActivity: Bool) async {
    Haptics.play(.reset)
    var s = state
    s.isRunning = false
    s.startedAt = 0
    s.accumulatedMs = 0
    await commit(s, keep: keepActivity)
  }

  public func toggle() async {
    if state.isRunning { await pause() } else { await start() }
  }

  // MARK: - Descanso

  public func startRest() async {
    await Notifications.requestPermission()
    var s = state
    s.restEndsAt = StopwatchState.nowMs() + s.restDurationMs
    let strings = Strings(lang: Settings.resolvedLanguage)
    let body = s.exerciseActive && !s.exerciseDone
      ? strings.restTextSet(s.sets + 1, s.setsTarget)
      : strings.restText
    Notifications.schedule(id: restAlertId, title: strings.restTitle, body: body, after: s.restDurationMs / 1000)
    scheduleRestEnd(after: s.restDurationMs / 1000)
    Haptics.play(.start)
    await commit(s, keep: true)
  }

  /// - Parameter keepActivity: true desde la pantalla de bloqueo (para poder iniciar otro descanso).
  public func cancelRest(keepActivity: Bool) async {
    cancelRestAlert()
    Haptics.play(.stop)
    var s = state
    s.restEndsAt = 0
    await commit(s, keep: keepActivity)
  }

  /// Botón azul de la Live Activity. Hace lo mismo que el botón principal de la app:
  /// descansando → saltar; ejercicio en marcha → terminé la serie o, si está completo,
  /// siguiente ejercicio; si no → iniciar descanso.
  public func restButton() async {
    let s = clearExpiredRest()
    if s.isResting {
      await cancelRest(keepActivity: true)
    } else if s.seriesControls && s.exerciseDone {
      await startExercise()
    } else if s.seriesControls {
      await completeSet()
    } else {
      await startRest()
    }
  }

  public func setRestDuration(_ ms: Double) async {
    var s = state
    s.restDurationMs = min(max(ms, Self.minRestMs), Self.maxRestMs)
    await commit(s, keep: false)
  }

  /// Limpia un descanso que ya terminó (la app estaba suspendida cuando acabó).
  @discardableResult
  public func clearExpiredRest() -> StopwatchState {
    var s = state
    if s.restEndsAt > 0 && !s.isResting {
      s.restEndsAt = 0
      state = s
    }
    return s
  }

  private func scheduleRestEnd(after seconds: Double) {
    restWorkItem?.cancel()
    let item = DispatchWorkItem { [weak self] in
      guard let self else { return }
      let before = self.state.restEndsAt
      let s = self.clearExpiredRest()
      guard before > 0, s.restEndsAt == 0 else { return }
      Task {
        await self.syncActivity(createIfNeeded: false)
        self.notifyChange()
      }
    }
    restWorkItem = item
    DispatchQueue.main.asyncAfter(deadline: .now() + seconds + 0.05, execute: item)
  }

  private func cancelRestAlert() {
    restWorkItem?.cancel()
    restWorkItem = nil
    Notifications.cancel(id: restAlertId)
  }

  // MARK: - Series (flujo guiado: configurar → en serie → descansando → completado)

  /// "Empezar" / "Siguiente ejercicio": serie 1 del ejercicio, con la configuración actual.
  public func startExercise() async {
    await Notifications.requestPermission()
    cancelRestAlert()
    Haptics.play(.start)
    var s = state
    s.exerciseActive = true
    s.sets = 0
    s.restEndsAt = 0
    await commit(s, keep: false)
  }

  /// "Terminé la serie". Si no era la última, arranca el descanso; si era la última, avisa.
  public func completeSet() async {
    var s = state
    guard s.exerciseActive, !s.exerciseDone else { return }
    s.sets += 1
    if !s.exerciseDone {
      state = s
      await startRest()
      return
    }
    // Última serie: sin descanso.
    cancelRestAlert()
    Haptics.play(.done)
    s.restEndsAt = 0
    await commit(s, keep: true)
    let strings = Strings(lang: Settings.resolvedLanguage)
    Notifications.schedule(
      id: restAlertId, title: strings.doneTitle, body: strings.doneText(s.setsTarget, s.setsTarget), after: nil)
  }

  /// Deshace la última serie (toque por error). Si había arrancado un descanso, lo cancela.
  public func undoSet() async {
    var s = state
    guard s.sets > 0 else { return }
    cancelRestAlert()
    Haptics.play(.stop)
    s.sets -= 1
    s.restEndsAt = 0
    await commit(s, keep: false)
  }

  /// "Terminar ejercicio" / "Cambiar series o descanso": vuelve a configurar.
  public func endExercise() async {
    var s = state
    if s.exerciseActive {
      cancelRestAlert()
      s.restEndsAt = 0
    }
    Haptics.play(.reset)
    s.exerciseActive = false
    s.sets = 0
    await commit(s, keep: false)
  }

  public func setSetsTarget(_ target: Int) async {
    var s = state
    // No se puede bajar por debajo de las ya hechas.
    s.setsTarget = min(max(target, max(Self.minSets, s.sets)), Self.maxSets)
    await commit(s, keep: false)
  }

  /// La app avisa de qué pestaña está abierta (decide qué hace el botón azul).
  public func setMode(_ mode: AppMode) async {
    var s = state
    guard s.mode != mode else { return }
    s.mode = mode
    await commit(s, keep: false)
  }

  // MARK: - Opciones editables

  public var restPresets: [Double] {
    (defaults.array(forKey: "restPresets") as? [Double]).flatMap { $0.isEmpty ? nil : $0 } ?? Self.defaultRestPresets
  }

  public var setsPresets: [Int] {
    (defaults.array(forKey: "setsPresets") as? [Int]).flatMap { $0.isEmpty ? nil : $0 } ?? Self.defaultSetsPresets
  }

  /// Guarda las listas ya validadas por la app; aquí solo se sanea (rango, duplicados, orden, tope).
  public func setPresets(rest: [Double], sets: [Int]) {
    let r = Array(Set(rest.filter { $0 >= Self.minRestMs && $0 <= Self.maxRestMs })).sorted().prefix(Self.maxPresets)
    let st = Array(Set(sets.filter { $0 >= Self.minSets && $0 <= Self.maxSets })).sorted().prefix(Self.maxPresets)
    defaults.set(r.isEmpty ? Self.defaultRestPresets : Array(r), forKey: "restPresets")
    defaults.set(st.isEmpty ? Self.defaultSetsPresets : Array(st), forKey: "setsPresets")
  }

  // MARK: - Live Activity

  /// Vuelve a mostrar la Live Activity si hay algo en marcha (al abrir la app, tras el límite
  /// de 8 h o si el usuario la quitó). Solo se puede crear con la app en primer plano.
  public func refresh() async {
    let s = clearExpiredRest()
    if s.hasContent { await syncActivity(createIfNeeded: true) }
  }

  /// Tras cambiar el idioma: actualiza los textos de la Live Activity.
  public func settingsChanged() async {
    await syncActivity(createIfNeeded: false)
  }

  private func contentState() -> StopwatchAttributes.ContentState {
    let s = state
    let elapsedSec = s.elapsedMs() / 1000
    let resting = s.isResting
    let restEnd = Date(timeIntervalSince1970: s.restEndsAt / 1000)
    return StopwatchAttributes.ContentState(
      isRunning: s.isRunning,
      startDate: Date().addingTimeInterval(-elapsedSec),
      elapsed: elapsedSec,
      restStart: resting ? restEnd.addingTimeInterval(-s.restDurationMs / 1000) : nil,
      restEnd: resting ? restEnd : nil,
      series: s.seriesControls,
      sets: s.sets,
      setsTarget: s.setsTarget,
      lang: Settings.resolvedLanguage
    )
  }

  private func syncActivity(createIfNeeded: Bool) async {
    // El widget con botones interactivos requiere iOS 17.
    guard #available(iOS 17.0, *) else { return }
    let cs = contentState()
    // Al terminar el descanso el contenido queda "stale" y el widget se vuelve a dibujar sin él.
    let content = ActivityContent(state: cs, staleDate: cs.restEnd)
    let activities = Activity<StopwatchAttributes>.activities

    if activities.isEmpty {
      guard createIfNeeded, ActivityAuthorizationInfo().areActivitiesEnabled else { return }
      do {
        _ = try Activity.request(attributes: StopwatchAttributes(title: "Achro"), content: content, pushType: nil)
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

// MARK: - Ajustes

/// Ajustes del usuario (mismas claves que Android). Viven en nativo porque el aviso y la
/// Live Activity se generan también con la app suspendida.
public enum Settings {
  private static var defaults: UserDefaults { .standard }
  static let languages: Set<String> = ["system", "es", "en"]
  static let themes: Set<String> = ["system", "dark", "light"]

  public static var language: String {
    let v = defaults.string(forKey: "language") ?? "system"
    return languages.contains(v) ? v : "system"
  }

  /// Tema de la app: "system" (por defecto), "dark" o "light". Solo lo usa la app (JS).
  public static var theme: String {
    let v = defaults.string(forKey: "theme") ?? "system"
    return themes.contains(v) ? v : "system"
  }

  public static var hapticsEnabled: Bool { defaults.object(forKey: "hapticsEnabled") as? Bool ?? true }
  public static var alertVibration: Bool { defaults.object(forKey: "alertVibration") as? Bool ?? true }
  public static var alertSound: Bool { defaults.object(forKey: "alertSound") as? Bool ?? true }

  /// Regla común con JS y Android: "sistema" = español si el teléfono está en español; si no, inglés.
  public static var resolvedLanguage: String {
    if language != "system" { return language }
    return (Locale.preferredLanguages.first ?? "en").hasPrefix("es") ? "es" : "en"
  }

  public static func toDictionary() -> [String: Any] {
    [
      "language": language,
      "theme": theme,
      "hapticsEnabled": hapticsEnabled,
      "alertVibration": alertVibration,
      "alertSound": alertSound,
    ]
  }

  /// Aplica solo las claves presentes y válidas.
  public static func update(_ values: [String: Any]) {
    if let l = values["language"] as? String, languages.contains(l) { defaults.set(l, forKey: "language") }
    if let t = values["theme"] as? String, themes.contains(t) { defaults.set(t, forKey: "theme") }
    for k in ["hapticsEnabled", "alertVibration", "alertSound"] {
      if let b = values[k] as? Bool { defaults.set(b, forKey: k) }
    }
  }
}

/// Textos de los avisos (los de la Live Activity están en el widget).
struct Strings {
  let lang: String
  private var es: Bool { lang == "es" }

  var restTitle: String { es ? "¡Descanso terminado!" : "Rest is over!" }
  var restText: String { es ? "A por la siguiente serie" : "Time for your next set" }
  func restTextSet(_ n: Int, _ total: Int) -> String {
    es ? "Empieza la serie \(n) de \(total)" : "Start set \(n) of \(total)"
  }
  var doneTitle: String { es ? "¡Ejercicio completado!" : "Exercise complete!" }
  func doneText(_ n: Int, _ total: Int) -> String { es ? "\(n) de \(total) series" : "\(n) of \(total) sets" }
}

// MARK: - Vibración de confirmación

/// Solo funciona con la app en primer plano: iOS no deja vibrar a una app en segundo plano
/// (los botones de la Live Activity la despiertan así).
enum Haptics {
  enum Kind { case start, stop, reset, done }

  static func play(_ kind: Kind) {
    guard Settings.hapticsEnabled else { return }
    DispatchQueue.main.async {
      guard UIApplication.shared.applicationState == .active else { return }
      switch kind {
      case .start: UIImpactFeedbackGenerator(style: .medium).impactOccurred()
      case .stop: UIImpactFeedbackGenerator(style: .light).impactOccurred()
      case .reset: UIImpactFeedbackGenerator(style: .heavy).impactOccurred()
      case .done: UINotificationFeedbackGenerator().notificationOccurred(.success)
      }
    }
  }
}

// MARK: - Aviso de fin de descanso

/// Notificaciones locales. Se programan al empezar el descanso: iOS las entrega aunque la app
/// esté suspendida o cerrada.
enum Notifications {
  static func requestPermission() async {
    let center = UNUserNotificationCenter.current()
    let settings = await center.notificationSettings()
    guard settings.authorizationStatus == .notDetermined else { return }
    _ = try? await center.requestAuthorization(options: [.alert, .sound])
  }

  /// - Parameter after: segundos hasta el aviso; nil = ya.
  static func schedule(id: String, title: String, body: String, after: Double?) {
    let content = UNMutableNotificationContent()
    content.title = title
    content.body = body
    // En iPhone la vibración del aviso va con el sonido (según los ajustes del sistema).
    if Settings.alertSound { content.sound = .default }
    content.interruptionLevel = .active
    let trigger = after.map { UNTimeIntervalNotificationTrigger(timeInterval: max(1, $0), repeats: false) }
    let center = UNUserNotificationCenter.current()
    center.removePendingNotificationRequests(withIdentifiers: [id])
    center.removeDeliveredNotifications(withIdentifiers: [id])
    center.add(UNNotificationRequest(identifier: id, content: content, trigger: trigger))
  }

  static func cancel(id: String) {
    let center = UNUserNotificationCenter.current()
    center.removePendingNotificationRequests(withIdentifiers: [id])
    center.removeDeliveredNotifications(withIdentifiers: [id])
  }
}

/// Con la app abierta iOS no muestra las notificaciones salvo que se le diga.
final class ForegroundNotificationPresenter: NSObject, UNUserNotificationCenterDelegate {
  static let shared = ForegroundNotificationPresenter()

  func userNotificationCenter(
    _ center: UNUserNotificationCenter,
    willPresent notification: UNNotification,
    withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
  ) {
    if Settings.alertVibration {
      AudioServicesPlaySystemSound(kSystemSoundID_Vibrate)
    }
    completionHandler(Settings.alertSound ? [.banner, .list, .sound] : [.banner, .list])
  }
}
