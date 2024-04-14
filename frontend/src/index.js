import { React, createContext, useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import './index.css';
import LegalNotice from './LegalNotice.js';
import Main from './Main.js';
import RecipePage from './Recipe.js';
import RecipeEditor from './RecipeEditor.js';
import reportWebVitals from './reportWebVitals';
import Login from './Login.js';
import Cookies from 'js-cookie';

const AuthContext = createContext();

const AuthContextProvider = ({ children }) => {
  const [loggedIn, setLoggedIn] = useState(Cookies.get('token') !== undefined ? true : false);
  const [user, setUser] = useState(Cookies.get('user') !== undefined ? Cookies.get('user') : null);
  const [token, setToken] = useState(Cookies.get('token') !== undefined ? Cookies.get('token') : null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    Cookies.set('token', token);
  }, [token]);

  useEffect(() => {
    Cookies.set('user', user);
  }, [user]);

  useEffect(() => {
    if (!loggedIn) {
      Cookies.remove('token');
      Cookies.remove('user');
    }
  }, [loggedIn]);

  useEffect(() => {
    Cookies.set('isAdmin', isAdmin);
  }, [isAdmin]);

  return (
    <AuthContext.Provider value={{ loggedIn, user, token, setLoggedIn, setUser, setToken, setIsAdmin }}>
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
    path: "recipe/:recipeId",
    element: <RecipePage />
  },
  {
    path: "create",
    element: <RecipeEditor />
  },
  {
    path: "edit/:recipeId",
    element: <RecipeEditor />
  },
  {
    path: "legalnotice",
    element: <LegalNotice />
  },
  {
    path: "login",
    element: <Login />
  }
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  // <React.StrictMode>
  <AuthContextProvider>
    <RouterProvider router={router} />
  </AuthContextProvider>
  // </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

export { AuthContext, AuthContextProvider };