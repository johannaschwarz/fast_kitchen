import { Alert, CircularProgress, Stack, TextField } from "@mui/material";
import { useContext, useState } from "react";
import { API_BASE } from "./Config";
import Footer from './Footer.jsx';
import Header from './Header.jsx';
import { AuthContext } from "./index";

const Login = () => {
    const { setLoggedIn, setUser, setToken, setIsAdmin } = useContext(AuthContext);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loginError, setLoginError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
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
                setLoginError('Anmeldung fehlgeschlagen: ' + data.detail);
            }
        } catch (err) {
            console.error(err);
            setLoginError('Die Anmeldung ist fehlgeschlagen. Bitte versuch es später erneut.');
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
                        <h3>Anmelden</h3>
                        <TextField type="text" label="Benutzername" required value={username} onChange={(event) => setUsername(event.target.value)} /><br />
                        <TextField type="password" label="Passwort" required value={password} onChange={(event) => setPassword(event.target.value)} /><br />
                        {!loading && <button type="submit" className="btn">Anmelden</button>}
                        {loading && <Stack direction={"row"} alignSelf="center"><CircularProgress aria-label="Anmeldung läuft" /></Stack>}
                    </Stack>
                </form>
            </div>
            <Footer />
        </div >
    )
}

export default Login;