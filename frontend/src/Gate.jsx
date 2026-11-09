import { Alert, CircularProgress, Stack, TextField } from '@mui/material';
import { useContext, useEffect, useState } from 'react';
import { API_BASE } from './Config';
import Footer from './Footer.jsx';
import Header from './Header.jsx';
import { AuthContext } from './index.jsx';
import './Gate.css';

const GATE_PROMPT = 'Bitte gib zuerst den geheimen Zauberspruch ein, um das Portal zur unerschöpflichen Quelle kulinarischer Schriften freizuschalten.';

function TypedPrompt({ text }) {
    const [reducedMotion] = useState(() => (
        typeof window !== 'undefined'
        && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ));
    const [visibleText, setVisibleText] = useState(reducedMotion ? text : '');

    useEffect(() => {
        if (reducedMotion) {
            return;
        }

        let index = 0;
        const interval = window.setInterval(() => {
            index += 1;
            setVisibleText(text.slice(0, index));

            if (index >= text.length) {
                window.clearInterval(interval);
            }
        }, 24);

        return () => window.clearInterval(interval);
    }, [reducedMotion, text]);

    return (
        <p className="gate-prompt">
            <span className="gate-prompt-placeholder" aria-hidden="true">{text}</span>
            <span className="gate-prompt-typed" aria-hidden="true">
                {visibleText}
                <span className="gate-typewriter-cursor" />
            </span>
            <span className="sr-only">{text}</span>
        </p>
    );
}

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
            <div className='content gate-content'>
                <div className="gate-figure">
                    <img
                        src="/le-grand-gardien.png"
                        alt="Le Grand Gardien, Wächter der Rezepte"
                        width="1024"
                        height="1536"
                    />
                </div>
                <div className="gate-panel">
                    {error && <Alert severity="error">{error}</Alert>}
                    <form onSubmit={handleSubmit}>
                        <Stack>
                            <h3>Halt Stop!</h3>
                            <TypedPrompt text={GATE_PROMPT} />
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
            </div>
            <Footer />
        </div>
    );
}

export default Gate;
