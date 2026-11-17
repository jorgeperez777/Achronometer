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

- Expo SDK 58, React Native 0.88, React 19.3, TypeScript 6. `react-native-safe-area-context` (edge-to-edge activo en Android). Proyecto creado con `create-expo-app --template blank-typescript` (sin Expo Router; una sola pantalla en `App.tsx`).
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
- `reset` **no** toca el descanso (cronómetro y descanso son independientes). Desde la app, la notificación solo se quita si tampoco hay descanso en curso.

### Series (Android e iOS)

Pestaña propia con **flujo guiado**, un solo botón principal por paso:
1. **Configurar** (`exerciseActive=false`): series 3–6 y descanso entre series en la misma pantalla → "Empezar" (`startExercise`).
2. **En serie** → "Terminé la serie" (`completeSet`: suma 1 y arranca el descanso). Enlaces: Deshacer serie, Terminar ejercicio (`endExercise` → vuelve a configurar).
3. **Descansando** → "Empezar serie N ya" (`cancelRest`). Enlace: Deshacer serie (`undoSet`, cancela el descanso).
4. **Completado** (tras la última serie no hay descanso; aviso "¡Ejercicio completado!" + vibración `DONE`) → "Siguiente ejercicio" (`startExercise`, misma configuración). Enlace: Cambiar series o descanso (`endExercise`).

Estado nativo: `exerciseActive`, `sets`, `setsTarget` (se recorta `sets` al leer), `mode` (pestaña abierta). La duración del descanso es la misma que la de la pestaña Descanso.
- **El botón azul de la notificación hace lo mismo que el botón principal** (`notificationRestButton`): ✕ si se descansa; con la pestaña Series abierta y ejercicio en marcha (`seriesControls`), ✓ / ⏭; si no, ⏳.
- Con `seriesControls` la notificación se muestra siempre; si el cronómetro no se usa, la línea grande muestra el progreso ("2/3", `stopwatch_title`) en vez de 00:00.
- Series, descanso y cronómetro son independientes: `reset` no toca las series.

### Ajustes: idioma, vibración y sonido

Pantalla de Ajustes (engranaje). **Viven en nativo** (`AppSettings`, `getSettings`/`setSettings`) porque la notificación, los avisos y la vibración se generan también con la app cerrada.
- **Idioma**: `system` (por defecto) / `es` / `en`. Regla común JS y nativo: "sistema" = español si el teléfono está en español; si no, inglés.
  - JS: `src/i18n.ts` (diccionarios) + `useLocales()` de `expo-localization` (reactivo). Todos los textos visibles y de accesibilidad pasan por `t()`; la validación devuelve claves (`err.*`), no frases.
  - Nativo: recursos `values/` (inglés, respaldo) y `values-es/`; con idioma forzado se usa `AppSettings.localized(context)`. Al cambiar el idioma se actualizan los nombres de los canales y la notificación visible.
- **Vibración al tocar** (`hapticsEnabled`) → `Haptics.play`. **Vibración y sonido del aviso** (`alertVibration`, `alertSound`) → los pone `RestDoneAlert` tras publicar el aviso.
  - El canal del aviso es `rest_done_v2`, **sin sonido ni vibración propios** (en Android 8+ un canal no se puede cambiar desde la app una vez creado). El antiguo `rest_done` se borra.
  - El sonido es el de notificaciones del sistema (`RingtoneManager`, `USAGE_NOTIFICATION_EVENT`): respeta volumen y modo silencio.
- iOS: mismas claves en `UserDefaults` (`Settings` en `StopwatchEngine.swift`). La vibración al tocar solo funciona con la app en primer plano (iOS no deja vibrar en segundo plano); la del aviso, con la app abierta (`AudioServicesPlaySystemSound`); con la app cerrada el iPhone vibra con el sonido de la notificación según sus ajustes. Los textos de Ajustes lo explican (`settings.*HintIos`).
- **Tema**: `system` (por defecto) / `dark` / `light` (`theme` en los ajustes nativos; solo lo usa JS). `app.json` tiene `userInterfaceStyle: "automatic"` para que "sistema" siga al teléfono; con tema forzado `Appearance.setColorScheme` cambia también los controles nativos (teclado, Switch, Modal). La notificación y la Live Activity no cambian.
  - Paletas `darkColors` / `lightColors` en `src/theme.ts` (mismas claves; en claro, verde/naranja/azul más oscuros para el contraste; `onAccent` = texto sobre un botón de color).
  - Los componentes **no importan colores**: `const makeStyles = (colors: Colors) => StyleSheet.create(...)` a nivel de módulo + `useThemedStyles(makeStyles)`; colores sueltos con `useColors()`.
- Iconos: `@expo/vector-icons` (Ionicons), no emojis.

### Opciones editables (duraciones y series)

El usuario puede añadir y borrar duraciones de descanso y números de series. Listas en nativo (`restPresets`/`setsPresets` en SharedPreferences, `getPresets`/`setPresets`), compartidas por las pestañas Descanso y Series.
- Validación en `src/presets.ts` (y el nativo vuelve a sanear): solo enteros; descanso 5 s – 30 min con segundos 0–59; series 1–20; sin duplicados; máx. 8 por lista. El error se muestra bajo los campos solo después de escribir.
- Por defecto: 1:00/1:30/2:00/3:00 y 3/4/5/6.

### Temporizador de descanso (Android e iOS)

Cuenta atrás entre series, **independiente** del cronómetro (se puede medir el entreno total y descansar a la vez).
Estado nativo extra: `restEndsAt` (epoch ms, 0 = sin descanso) y `restDurationMs` (60/90/120/180 s; 90 por defecto).
- Al iniciar se programa una alarma exacta (`AlarmManager.setExactAndAllowWhileIdle`) → `StopwatchActionReceiver` (`.REST_DONE`) → `finishRest` limpia el estado y publica el aviso "¡Descanso terminado!" (canal `rest_done`, `IMPORTANCE_HIGH`, vibración + sonido, id `4712`, se autodescarta a los 20 s).
- Permisos: `USE_EXACT_ALARM` (Android 13+, concedido al instalar), `SCHEDULE_EXACT_ALARM` con `maxSdkVersion=32`; en Android ≤ 11 no hace falta. Sin permiso exacto se usa `setAndAllowWhileIdle`.
- En la notificación: botón ⏳/✕ (`.REST`) y cuenta atrás azul (`Chronometer` con `setChronometerCountDown`).
- ✕ desde la notificación mantiene la notificación; cancelar desde la app la quita si el cronómetro está a 0.
- **Vibración de confirmación** (`Haptics.kt`) en cada acción del store: 1 pulso = iniciar/descanso, 2 = pausar/cancelar descanso, largo = reiniciar. Usa `USAGE_ALARM` porque Android ignora vibraciones de "toque" de apps en segundo plano (los botones de la notificación se pulsan así).
- Botones de la notificación: 48 dp contraída / 60 dp expandida (mínimo táctil recomendado).
- iOS (`StopwatchEngine.swift`, misma lógica que `StopwatchStore.kt`): con la app suspendida no se ejecuta código, así que el aviso de fin de descanso es una **notificación local programada** al empezar el descanso (`UNTimeIntervalNotificationTrigger`, id `achro.rest_done`); el descanso vencido se limpia al leer el estado (`clearExpiredRest`) y, con la app viva, con un `DispatchWorkItem`. `ForegroundNotificationPresenter` muestra el aviso también con la app abierta.
  - Live Activity: `ContentState` lleva `restStart/restEnd`, `series`, `sets`, `setsTarget` y `lang` (idioma ya resuelto; el widget traduce sus textos). `staleDate = restEnd` → al terminar el descanso el widget se redibuja sin la cuenta atrás. Tercer botón azul `RestButtonIntent` → `StopwatchEngine.restButton` (= `notificationRestButton`).
  - `refreshNotification` en iOS vuelve a crear la Live Activity si hay algo en marcha (al abrir / volver a la app).

### Mapa de archivos

```
App.tsx                         Pantalla con tres modos (pestañas): Cronómetro, Descanso y Series; SafeAreaProvider.
                                La pestaña abierta se guarda en nativo (`mode`).
src/ModeTabs.tsx                Pestañas; punto de color si otro modo sigue en marcha
src/SeriesView.tsx              Modo series: flujo guiado configurar → en serie → descansando → completado
src/PresetPicker.tsx            Chips seleccionables + "+" (añadir) + "Editar" (borrar; no la seleccionada ni la última)
src/AddPresetSheet.tsx          Hoja para añadir una opción: campos numéricos, validación en vivo, "Añadir" desactivado si no es válido
src/presets.ts                  Listas por defecto, límites y validación pura (validateRest / validateSets)
src/ModeLayout.tsx              Esqueleto común: número grande centrado + controles abajo a la misma altura en ambos modos
src/StopwatchView.tsx           Modo cronómetro: tiempo con centésimas + Reiniciar / Iniciar·Pausar
src/RestView.tsx                Modo descanso: duración que se convierte en cuenta atrás en el mismo sitio,
                                selector 1:00–3:00, botón Descansar / Saltar descanso
src/SettingsView.tsx            Ajustes (engranaje junto a las pestañas; "atrás" de Android lo cierra): idioma, tema, vibración, sonido
src/settings.tsx                SettingsProvider: ajustes (nativo), idioma y tema efectivos; useSettings / useT / useColors / useThemedStyles
src/i18n.ts                     Diccionarios es/en, translate, plural, speakDuration
src/theme.ts                    Tokens: paletas oscura/clara con colores con significado (verde iniciar, naranja pausar, azul descanso), espacios, radios
src/FixedDigits.tsx             Dígitos en celdas de ancho fijo (ver Gotcha 7)
src/useStopwatch.ts             Hook: lee estado nativo, escucha 'onChange', refresca al volver a primer plano,
                                pide POST_NOTIFICATIONS (Android 13+), llama refreshNotification al montar; expone `rest`
modules/stopwatch-controls/     Módulo Expo local (Expo Modules API), nombre nativo "StopwatchControls"
  index.ts, src/*.ts            API JS: cronómetro, descanso, series, presets, ajustes, refreshNotification; evento onChange
  ios/StopwatchEngine.swift     Motor iOS: estado, descanso, series, presets y ajustes en UserDefaults.standard,
                                Live Activity (ActivityKit), aviso (notificación local), Haptics + copia de StopwatchAttributes
  ios/StopwatchControlsModule.swift   Puente a JS; reenvía NotificationCenter → evento onChange
  android/.../StopwatchStore.kt        Estado en SharedPreferences + listeners
  android/.../StopwatchNotification.kt Notificación (RemoteViews con Chronometer + botones)
  android/.../StopwatchActionReceiver.kt BroadcastReceiver de los botones y de la alarma de descanso (funciona con la app cerrada)
  android/.../RestTimer.kt             RestAlarm (AlarmManager) + RestDoneAlert (aviso de fin de descanso)
  android/.../Haptics.kt               Vibración de confirmación por acción (respeta AppSettings.hapticsEnabled)
  android/.../AppSettings.kt           Ajustes en SharedPreferences + Context con el idioma elegido (localized)
  android/src/main/res/values{,-es}/strings.xml  Textos de la notificación y los avisos (inglés por defecto, español)
  android/.../StopwatchControlsModule.kt Puente a JS
  android/src/main/res/layout/stopwatch_notification{,_big}.xml  Vista contraída / expandida
  android/src/main/res/drawable/       ic_sw_play/pause/reset/rest/close, bg_sw_green/orange/gray/blue/blue_dim, ic_stopwatch
targets/widget/                 Widget Extension de iOS (apple-targets)
  expo-target.config.js         type widget, name StopwatchWidget, deploymentTarget 17.0
  StopwatchLiveActivity.swift   UI de la Live Activity + Dynamic Island + @main WidgetBundle
  StopwatchAttributes.swift     Copia del struct de atributos para el widget
  _shared/StopwatchIntents.swift  LiveActivityIntents (Toggle / Reset / RestButton); se compila en app Y widget
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
- Al reinstalar la app o reiniciar el teléfono Android borra la notificación; `useStopwatch` llama `refreshNotification()` (= `StopwatchStore.restoreNotification`) al montar **y al volver a primer plano** para recuperarla si hay algo en marcha.
- **Android 14+ deja quitar las notificaciones `ongoing` deslizando** con el teléfono desbloqueado (no bloqueado, ni con "Borrar todo"; en Android ≤ 13 no se pueden quitar). Por eso la notificación lleva `setDeleteIntent` → `StopwatchActionReceiver` (`.DISMISSED`) → `restoreNotification`: si se quita por error mientras hay algo en marcha, se vuelve a publicar al instante. Para quitarla de verdad hay que parar todo (cancelar desde la app no dispara el deleteIntent).
- Permiso `POST_NOTIFICATIONS` declarado en el manifest del módulo; se pide desde JS con `PermissionsAndroid` al pulsar Iniciar.
- Dependencia `androidx.core:core:1.13.1` en `modules/stopwatch-controls/android/build.gradle`.

## Icono y pantalla de inicio

Logo original: `assets/logo-ac.png` (monograma "AC" blanco sobre negro, 1254 px). El resto se genera de él con ImageMagick (transparencia = brillo del píxel):
- `icon.png` (iOS, 1024, fondo negro sin alfa), `favicon.png`.
- `android-icon-foreground.png` / `-monochrome.png`: logo blanco sobre transparente a ~57 % del ancho, dentro de la zona segura del icono adaptativo; fondo `#000000` como color (`adaptiveIcon.backgroundColor`).
- `splash-icon.png` (transparente) → plugin `expo-splash-screen` con fondo negro.
Tras cambiar cualquiera: `npx expo prebuild --clean` y recompilar.

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
npx expo lint                      # ESLint (eslint-config-expo). Hay 3 errores previos del React Compiler en useStopwatch.ts / AddPresetSheet.tsx
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
- ⚠️ iOS: **la Live Activity y sus botones no se han probado** en simulador ni dispositivo (no se pudo interactuar con el simulador). Descanso/Series/Ajustes en iOS compilan y las pestañas aparecen, pero falta prueba manual: Iniciar → ⌘L → ▶/⏸/↺ y el botón azul; descanso → aviso.
- Si en el simulador sale "Cannot find native module 'ExpoLocalization'": hay una instalación vieja `com.cronometro.app` que también registra `exp+cronometro://` y abre el deep link → `xcrun simctl uninstall booted com.cronometro.app`.
- ⚠️ iOS en dispositivo real requiere configurar el equipo de firma (`ios.appleTeamId` en `app.json` o en Xcode) para app y widget.
- ✅ Android probado en el Moto g55: la notificación muestra el tiempo y los botones Pausar → Reiniciar → Iniciar funcionan; la app se mantiene sincronizada.

## Ideas / pendientes

- Series: rutinas guardadas (ejercicios con nombre, series y descanso propios) e historial del entreno.
- Vueltas (laps).
- Cambiar `slug` a `achro` si se quiere que el deep link deje de decir `cronometro`.
- Probar comportamiento tras >8 h (límite de duración de Live Activities en iOS).
