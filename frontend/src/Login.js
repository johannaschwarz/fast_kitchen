import { TextField } from "@mui/material";
import { API_BASE } from "./Config";
import { useContext, useState } from "react";
import { AuthContext } from "./index";
import { Link } from "react-router-dom";
import Header from './Header.js';

const Login = () => {
    const { setLoggedIn, setUser, setToken, setIsAdmin } = useContext(AuthContext);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async () => {
        try {
            const response = await fetch(API_BASE + "token", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    username,
                    password,
                }).toString(),
            });
            if (response.ok) {
                const data = await response.json();
                setToken(data.access_token);
                setUser(data.user_id);
                setIsAdmin(data.is_admin);
                setLoggedIn(true);
            } else {
                console.error('Login failed');
            }
        } catch (err) {
            console.error(err);
        }
    }
    return (
        <div className="main">
            <Header />
            <div className='content'>
                <div>
                    <h3>Login</h3>
                    <TextField type="text" label="Username" value={username} onChange={(event) => setUsername(event.target.value)} />
                    <TextField type="password" label="Password" value={password} onChange={(event) => setPassword(event.target.value)} />
                    <button className="btn" onClick={handleLogin} >Login</button>
                </div>
            </div>
            <footer><Link to="/legalnotice">Impressum</Link></footer>
        </div>
    )
}

export default Login;