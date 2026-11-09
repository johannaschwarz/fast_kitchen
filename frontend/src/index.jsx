import { CircularProgress } from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { deDE } from '@mui/material/locale';
import Cookies from 'js-cookie';
import { createContext, useContext, useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import {
  Outlet,
  RouterProvider,
  createBrowserRouter,
} from "react-router-dom";
import { API_BASE, gateFetch } from './Config';
import Gate from './Gate.jsx';
import LegalNotice from './LegalNotice.jsx';
import Login from './Login.jsx';
import Main from './Main.jsx';
import PrivacyPolicy from './PrivacyPolicy.jsx';
import RecipePage from './Recipe.jsx';
import RecipeEditor from './RecipeEditor.jsx';
import Registration from './Registration.jsx';
import './index.css';


const AuthContext = createContext();

const AuthContextProvider = ({ children }) => {
  const [loggedIn, setLoggedIn] = useState(Cookies.get('token') !== undefined ? true : false);
  const [user, setUser] = useState(Cookies.get('user') !== undefined ? Cookies.get('user') : null);
  const [token, setToken] = useState(Cookies.get('token') !== undefined ? Cookies.get('token') : null);
  const [isAdmin, setIsAdmin] = useState(Cookies.get('isAdmin') !== undefined ? Cookies.get('isAdmin') === "true" : false);
  const [gateUnlocked, setGateUnlocked] = useState(false);
  const [gateChecking, setGateChecking] = useState(true);

  useEffect(() => {
    let active = true;
    gateFetch(API_BASE + 'gate/verify')
      .then((response) => {
        if (active) setGateUnlocked(response.ok);
      })
      .catch(() => {
        if (active) setGateUnlocked(false);
      })
      .finally(() => {
        if (active) setGateChecking(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => setGateUnlocked(false);

    window.addEventListener('gate:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('gate:unauthorized', handleUnauthorized);
  }, []);

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
    <AuthContext.Provider value={{
      loggedIn, user, token, isAdmin, setLoggedIn, setUser, setToken, setIsAdmin, logout,
      gateUnlocked, gateChecking, setGateUnlocked,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

const GateLayout = () => {
  const { gateUnlocked, gateChecking } = useContext(AuthContext);

  if (gateChecking) {
    return (
      <div className="main mystical">
        <div className="content" style={{ display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </div>
      </div>
    );
  }

  if (!gateUnlocked) {
    return <Gate />;
  }

  return <Outlet />;
};

const router = createBrowserRouter([
  {
    element: <GateLayout />,
    children: [
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
        path: "/login",
        element: <Login />
      },
      {
        path: "/register",
        element: <Registration />
      }
    ]
  },
  {
    path: "/legalnotice",
    element: <LegalNotice />
  },
  {
    path: "/privacy",
    element: <PrivacyPolicy />
  }
]);


const ThemeModeContext = createContext({ mode: 'light', toggleThemeMode: () => { } });

const ThemeModeProvider = ({ children }) => {
  const [mode, setMode] = useState('light');
  const theme = createTheme({
    palette: {
      mode,
    },
  }, deDE);
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


export { AuthContext, AuthContextProvider, ThemeModeContext };
