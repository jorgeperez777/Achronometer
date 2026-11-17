/**
 * Tokens de diseño. Cada color tiene UN significado en toda la app y en la notificación:
 * verde = iniciar, naranja = pausar, azul = descanso/series. Nada más lleva color.
 */
export const colors = {
  background: '#000000',
  surface: '#1C1C1E', // tarjeta "Ejercicio"
  surfaceRaised: '#2C2C2E', // botones secundarios sobre la tarjeta
  text: '#FFFFFF',
  textMuted: '#8E8E93', // contraste 6.9:1 sobre negro, 5.6:1 sobre surface
  start: '#30D158',
  startBg: '#0A2A12',
  pause: '#FF9F0A',
  pauseBg: '#332005',
  rest: '#0A84FF',
  restBg: '#0A2440',
  danger: '#FF453A', // errores de validación (5.2:1 sobre surface)
} as const;

export const space = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;

export const radius = { md: 14, lg: 24, pill: 999 } as const;

/** Mínimo táctil de Android (48 dp). */
export const TOUCH_MIN = 48;

export const pressedStyle = { opacity: 0.7 } as const;
