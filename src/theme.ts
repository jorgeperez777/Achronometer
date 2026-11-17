/**
 * Tokens de diseño. Cada color tiene UN significado en toda la app y en la notificación:
 * verde = iniciar, naranja = pausar, azul = descanso/series. Nada más lleva color.
 * Dos paletas con las mismas claves; los componentes la leen con useColors / useThemedStyles.
 */
export const darkColors = {
  background: '#000000',
  surface: '#1C1C1E',
  surfaceRaised: '#2C2C2E',
  text: '#FFFFFF',
  textMuted: '#8E8E93', // contraste 6.9:1 sobre negro, 5.6:1 sobre surface
  start: '#30D158',
  startBg: '#0A2A12',
  pause: '#FF9F0A',
  pauseBg: '#332005',
  rest: '#0A84FF',
  restBg: '#0A2440',
  danger: '#FF453A', // errores de validación (5.2:1 sobre surface)
  /** Texto sobre un fondo de color sólido (botón azul). */
  onAccent: '#FFFFFF',
  /** Botón secundario (Reiniciar, Saltar descanso, Cancelar): tiene que destacar del fondo. */
  secondary: '#2C2C2E',
  secondaryBorder: '#2C2C2E',
  border: '#3A3A3C',
  borderStrong: '#48484A',
  placeholder: '#48484A',
  backdrop: '#000000B3',
};

export type Colors = typeof darkColors;

/** Tema claro: tonos más oscuros de los mismos colores para mantener el contraste sobre blanco. */
export const lightColors: Colors = {
  background: '#F2F2F7',
  surface: '#FFFFFF',
  surfaceRaised: '#E5E5EA',
  text: '#000000',
  textMuted: '#6C6C70', // 5.0:1 sobre background, 5.4:1 sobre blanco
  start: '#1E7A34', // 5.2:1 sobre startBg
  startBg: '#D4F5DC',
  pause: '#A84B00', // 5.3:1 sobre pauseBg
  pauseBg: '#FFE7C7',
  rest: '#0063D1', // 5.4:1 con texto blanco encima y sobre blanco
  restBg: '#DCEBFF',
  danger: '#D70015',
  onAccent: '#FFFFFF',
  secondary: '#DADADF',
  secondaryBorder: '#A1A1A6', // 2.4:1 sobre el fondo: el botón se distingue
  border: '#D1D1D6',
  borderStrong: '#AEAEB2',
  placeholder: '#AEAEB2',
  backdrop: '#00000059',
};

export const space = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;

export const radius = { md: 14, lg: 24, pill: 999 } as const;

/** Mínimo táctil de Android (48 dp). */
export const TOUCH_MIN = 48;

export const pressedStyle = { opacity: 0.7 } as const;
