import { Alert, CircularProgress, Stack, TextField } from "@mui/material";
import { useContext, useState } from "react";
import { API_BASE } from "./Config";
import Footer from './Footer.js';
import Header from './Header.js';
import { AuthContext } from "./index";

const Login = () => {
    const { setLoggedIn, setUser, setToken, setIsAdmin } = useContext(AuthContext);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loginError, setLoginError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        try {
            setLoginError('');
            setLoading(true);
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

                // Redirect to home page
                window.location.href = '/';
            } else {
                const data = await response.json();
                setLoginError('Login failed: ' + data.detail);
            }
        } catch (err) {
            console.error(err);
            setLoginError('Login failed, please try again later.');
        }
        setLoading(false);
    }
    return (
        <div className="main">
            <Header />
            <div className='content'>
                {loginError && <Alert severity="error">{loginError}</Alert>}
                <form onSubmit={handleLogin}>
                    <Stack>
                        <h3>Login</h3>
                        <TextField type="text" label="Username" required value={username} onChange={(event) => setUsername(event.target.value)} /><br />
                        <TextField type="password" label="Password" required value={password} onChange={(event) => setPassword(event.target.value)} /><br />
                        {!loading && <button type="submit" className="btn">Login</button>}
                        {loading && <Stack direction={"row"} alignSelf="center"><CircularProgress /></Stack>}
                    </Stack>
                </form>
            </div>
            <Footer />
        </div >
    )
}

export default Login;