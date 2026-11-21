import { createContext } from 'react';

export const AuthContext = createContext();

export const ThemeModeContext = createContext({ mode: 'light', toggleThemeMode: () => { } });
