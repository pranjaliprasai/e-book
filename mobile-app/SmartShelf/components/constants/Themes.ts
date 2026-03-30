export type ThemeColors = {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  textMuted: string;
  border: string;
  accent: string;
  cardShadow: string;
};

export type ThemeType = 'green' | 'pink' | 'brown' | 'yellow';

export const Themes: Record<ThemeType, ThemeColors> = {
  green: {
    primary: '#4F7942',
    secondary: '#8B7D6B',
    background: '#F9F9F7',
    surface: '#FFFFFF',
    text: '#2F4F4F',
    textMuted: '#8B7D6B',
    border: '#EBE9E2',
    accent: '#6B8E23',
    cardShadow: 'rgba(0,0,0,0.05)',
  },
  pink: {
    primary: '#D84B7E',
    secondary: '#8B7D6B',
    background: '#FFF5F8',
    surface: '#FFFFFF',
    text: '#4A1D2D',
    textMuted: '#A07D89',
    border: '#F3D1DC',
    accent: '#FF6B6B',
    cardShadow: 'rgba(216,75,126,0.1)',
  },
  brown: {
    primary: '#5D4037',
    secondary: '#8D6E63',
    background: '#FDF8F5',
    surface: '#FFFFFF',
    text: '#3E2723',
    textMuted: '#A1887F',
    border: '#E7D7D2',
    accent: '#795548',
    cardShadow: 'rgba(93,64,55,0.1)',
  },
  yellow: {
    primary: '#B8860B',
    secondary: '#DAA520',
    background: '#FFFDF0',
    surface: '#FFFFFF',
    text: '#4B3621',
    textMuted: '#8B7D6B',
    border: '#F3E5AB',
    accent: '#FFD700',
    cardShadow: 'rgba(184,134,11,0.1)',
  },
};
