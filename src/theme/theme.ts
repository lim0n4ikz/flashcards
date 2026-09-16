import { Platform } from 'react-native';

export const lightTheme = {
  background: '#F7F8FA',
  card: '#FFFFFF',
  sheet: '#FFFFFF',
  text: '#1F2937',
  secondaryText: '#6B7280',
  primary: '#4F46E5',
  primaryText: '#FFFFFF',
  border: '#E5E7EB',
  success: '#16A34A',
  danger: '#DC2626',
  warning: '#D97706',
  input: '#FFFFFF',
  shadow: '#000000',
};

export const darkTheme = {
  background: '#111827',
  card: '#1F2937',
  sheet: '#1F2937',
  text: '#F9FAFB',
  secondaryText: '#9CA3AF',
  primary: '#818CF8',
  primaryText: '#111827',
  border: '#374151',
  success: '#4ADE80',
  danger: '#F87171',
  warning: '#FBBF24',
  input: '#1F2937',
  shadow: '#000000',
};

export type AppTheme = typeof lightTheme;

export const getTheme = (mode: 'light' | 'dark'): AppTheme => {
  return mode === 'dark' ? darkTheme : lightTheme;
};

export const commonStyles = {
  shadow: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
      default: {},
    }),
  },
};