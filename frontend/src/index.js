import { ThemeProvider, createTheme } from '@mui/material/styles';
import Cookies from 'js-cookie';
import { createContext, useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import {
  RouterProvider,
  createBrowserRouter,
} from "react-router-dom";
import LegalNotice from './LegalNotice.js';
import Login from './Login.js';
import Main from './Main.js';
import RecipePage from './Recipe.js';
import RecipeEditor from './RecipeEditor.js';
import Registration from './Registration.js';
import './index.css';
import reportWebVitals from './reportWebVitals';

const AuthContext = createContext();

const AuthContextProvider = ({ children }) => {
  const [loggedIn, setLoggedIn] = useState(Cookies.get('token') !== undefined ? true : false);
  const [user, setUser] = useState(Cookies.get('user') !== undefined ? Cookies.get('user') : null);
  const [token, setToken] = useState(Cookies.get('token') !== undefined ? Cookies.get('token') : null);
  const [isAdmin, setIsAdmin] = useState(Cookies.get('isAdmin') !== undefined ? Cookies.get('isAdmin') === "true" : false);

  useEffect(() => {
    if (token)
      Cookies.set('token', token);
    else
      Cookies.remove('token');
  }, [token]);

  useEffect(() => {
    if (user)
      Cookies.set('user', user);
    else
      Cookies.remove('user');
  }, [user]);

  useEffect(() => {
    if (!loggedIn) {
      Cookies.remove('token');
      Cookies.remove('user');
    }
  }, [loggedIn]);

  useEffect(() => {
    if (isAdmin)
      Cookies.set('isAdmin', isAdmin);
    else
      Cookies.remove('isAdmin');
  }, [isAdmin]);

  const logout = () => {
    setLoggedIn(false);
    setUser(null);
    setToken(null);
    setIsAdmin(false);
  }

  return (
    <AuthContext.Provider value={{ loggedIn, user, token, isAdmin, setLoggedIn, setUser, setToken, setIsAdmin, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <Main />,
  },
  {
    path: "/recipe/:recipeId",
    element: <RecipePage />
  },
  {
    path: "/create",
    element: <RecipeEditor />
  },
  {
    path: "/edit/:recipeId",
    element: <RecipeEditor />
  },
  {
    path: "/legalnotice",
    element: <LegalNotice />
  },
  {
    path: "/login",
    element: <Login />
  },
  {
    path: "/register",
    element: <Registration />
  }
]);


const ThemeModeContext = createContext({ mode: 'light', toggleThemeMode: () => { } });

const ThemeModeProvider = ({ children }) => {
  const [mode, setMode] = useState('light');
  const theme = createTheme({
    palette: {
      mode,
    },
  });
  const toggleThemeMode = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };
  return (
    <ThemeModeContext.Provider value={{ mode, toggleThemeMode }}>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </ThemeModeContext.Provider>
  );
};


ReactDOM.createRoot(document.getElementById("root")).render(
  <ThemeModeProvider>
    <AuthContextProvider>
      <RouterProvider router={router} />
    </AuthContextProvider>
  </ThemeModeProvider>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

export { AuthContext, AuthContextProvider, ThemeModeContext };
