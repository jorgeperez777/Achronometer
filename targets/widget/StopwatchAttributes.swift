import ActivityKit
import Foundation

/// Copia para el widget. IMPORTANTE: debe ser idéntica a la de
/// `modules/stopwatch-controls/ios/StopwatchEngine.swift` (ActivityKit los empareja por nombre).
struct StopwatchAttributes: ActivityAttributes {
  public struct ContentState: Codable, Hashable {
    var isRunning: Bool
    var startDate: Date
    var elapsed: Double
  }

  var title: String
}
