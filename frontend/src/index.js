import { React, createContext, useState } from 'react';
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

const AuthContext = createContext();

const AuthContextProvider = ({ children }) => {
  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState("");

  return (
    <AuthContext.Provider value={{ loggedIn, user, token, setLoggedIn, setUser, setToken }}>
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