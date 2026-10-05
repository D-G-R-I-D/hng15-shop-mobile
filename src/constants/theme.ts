import { Platform } from 'react-native';

// Same palette as the website (shop-app/src/app/globals.css).
export const Colors = {
  light: {
    background: '#f6f5f2',
    surface: '#ffffff',
    text: '#1c1917',
    muted: '#78716c',
    line: '#e7e5e4',
    accent: '#c2410c',
    onPrimary: '#f6f5f2',
  },
  dark: {
    background: '#121110',
    surface: '#1c1a18',
    text: '#f5f5f4',
    muted: '#a8a29e',
    line: '#2e2b28',
    accent: '#ea580c',
    onPrimary: '#121110',
  },
} as const;

export type Palette = (typeof Colors)['light'] | (typeof Colors)['dark'];

export const Fonts = {
  display: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
};

export const Spacing = {
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
} as const;
