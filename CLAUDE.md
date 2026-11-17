# Achro — Cronómetro con controles en la pantalla de bloqueo

App de cronómetro en React Native (Expo) cuya función principal es poder **pausar, reiniciar y volver a iniciar el cronómetro desde la pantalla de bloqueo**, sin abrir la app:
- **iOS**: Live Activity (pantalla de bloqueo + Dynamic Island) con botones interactivos. Requiere iOS 17+.
- **Android**: notificación persistente con cronómetro del sistema y botones propios.

Lee también [AGENTS.md](AGENTS.md) (reglas generales de Expo del template: consultar docs versionados, usar `npx expo install`, no editar `ios/`/`android/` a mano).

## Identidad

| Campo | Valor |
|---|---|
| Nombre visible | `Achro` (`expo.name`) |
| Package Android / Bundle ID iOS | `com.achronometer.app` |
| Widget iOS | `com.achronometer.app.StopwatchWidget` |
| `slug` | `Cronometro` (sin cambiar → el deep link del dev client es `exp+cronometro://`) |
| Carpeta | `workProjects/Cronometro` |

## Stack

- Expo SDK 58, React Native 0.88, React 19.3, TypeScript 6. Proyecto creado con `create-expo-app --template blank-typescript` (sin Expo Router; una sola pantalla en `App.tsx`).
- **Dev build** (`expo-dev-client`). **No funciona en Expo Go**: tiene código nativo propio.
- `@bacons/apple-targets` 5.x para el widget de iOS.
- Continuous Native Generation: `ios/` y `android/` se generan con `npx expo prebuild --clean` y están en `.gitignore`. Todo lo nativo vive en `modules/` y `targets/`.

## Arquitectura

**Principio clave: el estado del cronómetro vive en nativo, no en JS.** Los botones de la pantalla de bloqueo deben funcionar con la app suspendida o cerrada, así que nativo es la única fuente de verdad y JS solo lo refleja.

Modelo de estado (igual en las 3 capas):
```ts
{ isRunning: boolean; startedAt: number /* epoch ms de la tanda actual */; accumulatedMs: number }
// transcurrido = accumulatedMs + (isRunning ? now - startedAt : 0)
```

Semántica de acciones:
- `start` = iniciar o reanudar. `pause` = acumula y detiene. `toggle` = start/pause.
- `reset` **desde la app** → 0 y **quita** la Live Activity/notificación.
- `reset` **desde la pantalla de bloqueo** → 0 pero **mantiene** los controles visibles (con botón ▶) para poder volver a iniciar desde ahí.
- `reset` también cancela el descanso en curso.

### Temporizador de descanso (solo Android, de momento)

Cuenta atrás entre series, **independiente** del cronómetro (se puede medir el entreno total y descansar a la vez).
Estado nativo extra: `restEndsAt` (epoch ms, 0 = sin descanso) y `restDurationMs` (60/90/120/180 s; 90 por defecto).
- Al iniciar se programa una alarma exacta (`AlarmManager.setExactAndAllowWhileIdle`) → `StopwatchActionReceiver` (`.REST_DONE`) → `finishRest` limpia el estado y publica el aviso "¡Descanso terminado!" (canal `rest_done`, `IMPORTANCE_HIGH`, vibración + sonido, id `4712`, se autodescarta a los 20 s).
- Permisos: `USE_EXACT_ALARM` (Android 13+, concedido al instalar), `SCHEDULE_EXACT_ALARM` con `maxSdkVersion=32`; en Android ≤ 11 no hace falta. Sin permiso exacto se usa `setAndAllowWhileIdle`.
- En la notificación: botón ⏳/✕ (`.REST`) y cuenta atrás azul (`Chronometer` con `setChronometerCountDown`).
- ✕ desde la notificación mantiene la notificación; cancelar desde la app la quita si el cronómetro está a 0.
- iOS: `startRest`/`cancelRest`/`setRestDuration` no existen en el módulo iOS; en TS son opcionales y `RestPanel` se oculta (`restSupported`).

### Mapa de archivos

```
App.tsx                         UI (pantalla única, tema oscuro, centésimas)
src/FixedDigits.tsx             Dígitos en celdas de ancho fijo (ver Gotcha 7)
src/RestPanel.tsx               UI del descanso: duraciones, botón y cuenta atrás
src/useStopwatch.ts             Hook: lee estado nativo, escucha 'onChange', refresca al volver a primer plano,
                                pide POST_NOTIFICATIONS (Android 13+), llama refreshNotification al montar; expone `rest`
modules/stopwatch-controls/     Módulo Expo local (Expo Modules API), nombre nativo "StopwatchControls"
  index.ts, src/*.ts            API JS: getState(), start(), pause(), reset(), refreshNotification?() (solo Android), evento onChange
  ios/StopwatchEngine.swift     Motor iOS: estado en UserDefaults.standard + gestión de la Live Activity (ActivityKit)
                                + copia de StopwatchAttributes (ver "Gotchas")
  ios/StopwatchControlsModule.swift   Puente a JS; reenvía NotificationCenter → evento onChange
  android/.../StopwatchStore.kt        Estado en SharedPreferences + listeners
  android/.../StopwatchNotification.kt Notificación (RemoteViews con Chronometer + botones)
  android/.../StopwatchActionReceiver.kt BroadcastReceiver de los botones y de la alarma de descanso (funciona con la app cerrada)
  android/.../RestTimer.kt             RestAlarm (AlarmManager) + RestDoneAlert (aviso de fin de descanso)
  android/.../StopwatchControlsModule.kt Puente a JS
  android/src/main/res/layout/stopwatch_notification{,_big}.xml  Vista contraída / expandida
  android/src/main/res/drawable/       ic_sw_play/pause/reset/rest/close, bg_sw_green/orange/gray/blue/blue_dim, ic_stopwatch
targets/widget/                 Widget Extension de iOS (apple-targets)
  expo-target.config.js         type widget, name StopwatchWidget, deploymentTarget 17.0
  StopwatchLiveActivity.swift   UI de la Live Activity + Dynamic Island + @main WidgetBundle
  StopwatchAttributes.swift     Copia del struct de atributos para el widget
  _shared/StopwatchIntents.swift  LiveActivityIntents (Toggle / Reset); se compila en app Y widget
```

### iOS en detalle

- La Live Activity se crea al primer `start()` (si `ActivityAuthorizationInfo().areActivitiesEnabled`). Requiere iOS 17 (guard en `syncActivity`).
- Mientras corre, el widget usa `Text(timerInterval: startDate...Date.distantFuture, countsDown: false)` → **el sistema anima el tiempo solo**, sin updates. En pausa muestra texto fijo formateado.
- Botones: `Button(intent: ToggleStopwatchIntent())` / `ResetStopwatchIntent()`. Son `LiveActivityIntent`, que **iOS ejecuta en el proceso de la app** (la despierta en segundo plano). Por eso viven en `_shared/` (apple-targets los enlaza a ambos targets) y llaman a `StopwatchEngine.shared` dentro de `#if canImport(StopwatchControls)` (en el widget no existe ese módulo y el cuerpo queda vacío).
- `StopwatchEngine` publica `StopwatchEngineDidChange` en NotificationCenter → el módulo emite `onChange` a JS.
- No hace falta App Group: el widget solo lee el `ContentState`; el estado persistente se lee/escribe en el proceso de la app.
- `app.json` → `ios.infoPlist.NSSupportsLiveActivities = true`.

### Android en detalle

- No hay foreground service: la notificación usa `Chronometer` en `RemoteViews` (`setChronometer(base = elapsedRealtime - transcurrido, started = isRunning)`), que **el sistema anima solo**.
- Los botones están **dentro de la vista personalizada** (`setOnClickPendingIntent`), no como `addAction`. Motivo: en la pantalla de bloqueo / con la notificación contraída, las actions estándar no se ven. Así se ven siempre.
- Canal `stopwatch` con `IMPORTANCE_DEFAULT` pero sin sonido ni vibración (`IMPORTANCE_LOW` haría que se ocultara en la pantalla de bloqueo en varios Android). `VISIBILITY_PUBLIC`, `CATEGORY_STOPWATCH`, `setOngoing(true)`, id `4711`.
- `StopwatchActionReceiver` (manifest del módulo, `exported=false`) recibe `expo.modules.stopwatchcontrols.TOGGLE` / `.RESET`, actualiza el store y vuelve a publicar la notificación.
- Al reinstalar la app o reiniciar el teléfono Android borra la notificación; `useStopwatch` llama `refreshNotification()` al montar para recuperarla si había tiempo acumulado.
- Permiso `POST_NOTIFICATIONS` declarado en el manifest del módulo; se pide desde JS con `PermissionsAndroid` al pulsar Iniciar.
- Dependencia `androidx.core:core:1.13.1` en `modules/stopwatch-controls/android/build.gradle`.

## Gotchas (importantes)

1. **`StopwatchAttributes` está duplicado** en `modules/stopwatch-controls/ios/StopwatchEngine.swift` y `targets/widget/StopwatchAttributes.swift`. ActivityKit los empareja por nombre: **deben tener exactamente el mismo nombre y campos**. Si cambias uno, cambia el otro o la Live Activity deja de renderizar.
2. En `_shared/StopwatchIntents.swift` el import debe ser **`internal import StopwatchControls`** (no `import` a secas): Expo genera otro import `internal` del mismo módulo en el target de la app y Swift da error "ambiguous implicit access level".
3. Si añades/renombras/borras archivos en `targets/widget/_shared/`, hay que re-ejecutar `npx expo prebuild --clean`.
4. Cualquier cambio en `app.json`, `expo-target.config.js` o código nativo (`modules/`, `targets/`) requiere prebuild + recompilar; Fast Refresh solo cubre JS.
5. El podspec del módulo es solo iOS (se quitó tvOS) y enlaza `ActivityKit`. `expo-module.config.json` declara solo `apple` y `android` (se quitó web y el stub `.web.ts`).
6. Requiere **CocoaPods ≥ 1.16.2** (apple-targets usa carpetas sincronizadas de Xcode 16). En esta máquina se actualizó a 1.17.0.
7. **Dígitos que "tiemblan"**: la fuente de sistema de algunos Android (Motorola) ignora `fontVariant: ['tabular-nums']`; por eso los números grandes usan `FixedDigits` (cada dígito en una celda de ancho fijo). En la notificación los `Chronometer` llevan `fontFeatureSettings="tnum"` y ancho `match_parent`.
8. **Fast Refresh en Android** a veces no aplica los cambios: si no se ven, cerrar y reabrir la app.

## Comandos

```bash
npx expo prebuild --clean          # regenerar ios/ y android/
npx expo run:ios                   # compilar + instalar + Metro (simulador)
npx expo run:android               # ídem en Android (dispositivo por USB o emulador)
npx expo start --dev-client        # solo Metro
npx tsc --noEmit                   # typecheck
npx expo lint
```

Build manual (lo que se usó al desarrollar):
```bash
# iOS (simulador iPhone 15 Pro, iOS 17.5)
cd ios && xcodebuild -workspace Achro.xcworkspace -scheme Achro -configuration Debug \
  -sdk iphonesimulator -destination 'id=BCA3BC6A-C087-400E-95C0-8E4CD523B70F' -derivedDataPath build build

# Android (solo arm64 para ir más rápido)
cd android && JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home" \
  ./gradlew :app:assembleDebug -PreactNativeArchitectures=arm64-v8a
adb install -r app/build/outputs/apk/debug/app-debug.apk
adb reverse tcp:8081 tcp:8081
adb shell am start -a android.intent.action.VIEW \
  -d "exp+cronometro://expo-development-client/?url=http%3A%2F%2Flocalhost%3A8081" com.achronometer.app
```

## Entorno de desarrollo (macOS de Jorge)

- Node 22, Xcode 26.6, Watchman, Android SDK en `~/Library/Android/sdk`, Ruby 3.3.0 vía asdf, CocoaPods 1.17.0.
- `java` **no tiene versión asignada en asdf**; usar el JDK de Android Studio (JBR 17): `export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"`.
- Dispositivo de pruebas Android: **Moto g55 5G**, Android 14, arm64. Su pantalla de bloqueo está configurada para mostrar notificaciones **solo como íconos**; para ver los botones ahí hay que cambiar el ajuste del sistema a notificaciones completas.
- El primer build de Gradle tarda ~12 min (descarga de dependencias); los incrementales, segundos.
- No hay herramienta para tocar el simulador de iOS desde la terminal (osascript sin permisos de accesibilidad, sin idb). En Android sí: `adb shell input tap X Y` y `adb exec-out screencap -p > shot.png`.

## Estado de verificación

- ✅ iOS compila (app + widget) y la app corre en el simulador.
- ⚠️ iOS: **la Live Activity y sus botones no se han probado** en simulador ni dispositivo (no se pudo interactuar con el simulador). Pendiente de prueba manual: Iniciar → ⌘L → probar ▶/⏸/↺.
- ⚠️ iOS en dispositivo real requiere configurar el equipo de firma (`ios.appleTeamId` en `app.json` o en Xcode) para app y widget.
- ✅ Android probado en el Moto g55: la notificación muestra el tiempo y los botones Pausar → Reiniciar → Iniciar funcionan; la app se mantiene sincronizada.

## Ideas / pendientes

- Descanso en iOS (Live Activity con `Text(timerInterval:countsDown:)` + notificación local al terminar).
- Contador de series, botones más grandes, vibración al tocar.
- Vueltas (laps).
- Cambiar `slug` a `achro` si se quiere que el deep link deje de decir `cronometro`.
- Icono propio de la app (sigue el del template de Expo).
- Probar comportamiento tras >8 h (límite de duración de Live Activities en iOS).
