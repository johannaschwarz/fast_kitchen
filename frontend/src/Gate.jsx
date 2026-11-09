import { Alert, CircularProgress, Stack, TextField } from '@mui/material';
import { useContext, useState } from 'react';
import { API_BASE } from './Config';
import Footer from './Footer.jsx';
import Header from './Header.jsx';
import { AuthContext } from './index.jsx';

function Gate() {
    const { setGateUnlocked } = useContext(AuthContext);
    const [passphrase, setPassphrase] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch(API_BASE + 'gate/unlock', {
                method: 'POST',
                // Required so the browser stores the API's HttpOnly gate cookie.
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ passphrase }),
            });

            if (response.ok) {
                setGateUnlocked(true);
                return;
            }

            const data = await response.json().catch(() => ({}));
            setError(data.detail || 'Das Zugangspasswort ist nicht korrekt.');
        } catch (err) {
            console.error(err);
            setError('Die Rezepte konnten nicht entsperrt werden. Bitte versuche es später erneut.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="main">
            <Header showSearch={false} />
            <div className='content'>
                {error && <Alert severity="error">{error}</Alert>}
                <form onSubmit={handleSubmit}>
                    <Stack>
                        <h3>Private Rezeptsammlung</h3>
                        <p>Bitte gib das gemeinsame Zugangspasswort ein, um die Rezepte zu sehen.</p>
                        <TextField
                            type="password"
                            label="Zugangspasswort"
                            required
                            autoFocus
                            value={passphrase}
                            onChange={(event) => setPassphrase(event.target.value)}
                        /><br />
                        {!loading && <button type="submit" className="btn">Entsperren</button>}
                        {loading && <Stack direction={"row"} alignSelf="center"><CircularProgress /></Stack>}
                    </Stack>
                </form>
            </div>
            <Footer />
        </div>
    );
}

export default Gate;
