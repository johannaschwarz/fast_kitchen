import { CircularProgress, Stack, TextField } from '@mui/material';
import { useContext, useEffect, useState } from 'react';
import { API_BASE } from './Config';
import Footer from './Footer.jsx';
import Header from './Header.jsx';
import { AuthContext } from './index.jsx';
import './Gate.css';

const GATE_PROMPT = 'Bitte gib zuerst den geheimen Zauberspruch ein, um das Portal zur unerschöpflichen Quelle kulinarischer Schriften freizuschalten.';
const FAILED_ATTEMPT_MESSAGES = [
    'Falsch. Die Passphrase schützt uns vor der nächsten Abmahnung, nicht vor deinen Tippfehlern.',
    'Immer noch falsch. Genau wegen so etwas haben wir überhaupt eine Passphrase.',
    'Nein. Ohne Passphrase gibt es keine Rezepte – nur die nächste Abmahnung.',
    'Falsch. Le Grand Guardien hält die Abmahnung nur noch mit Mühe zurück.',
];
const RATE_LIMIT_MESSAGE = 'Jetzt reicht’s. Le Grand Guardien hat die Abmahnung bereits unterschrieben. Bitte versuche es später noch einmal.';
const CONNECTION_ERROR_MESSAGE = 'Le Grand Guardien schaut verwirrt. Das Portal antwortet gerade nicht. Bitte versuche es später erneut.';

function TypedPrompt({ text, reserveText = text }) {
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
            <span className="gate-prompt-placeholder" aria-hidden="true">{reserveText}</span>
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
    const [promptText, setPromptText] = useState(GATE_PROMPT);
    const [failureCount, setFailureCount] = useState(0);
    const [guardianFurious, setGuardianFurious] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (loading) {
            return;
        }

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

            setGuardianFurious(true);

            if (response.status === 429) {
                setPromptText(RATE_LIMIT_MESSAGE);
                return;
            }

            if (response.status === 401) {
                const nextFailure = failureCount + 1;
                const messageIndex = (nextFailure - 1) % FAILED_ATTEMPT_MESSAGES.length;
                setFailureCount(nextFailure);
                setPromptText(FAILED_ATTEMPT_MESSAGES[messageIndex]);
                return;
            }

            setPromptText(CONNECTION_ERROR_MESSAGE);
        } catch (err) {
            console.error(err);
            setGuardianFurious(true);
            setPromptText(CONNECTION_ERROR_MESSAGE);
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
                        src={guardianFurious ? '/le-grand-gardien-furieux.png' : '/le-grand-gardien.png'}
                        alt={guardianFurious ? 'Le Grand Guardien furieux' : 'Le Grand Guardien, Wächter der Rezepte'}
                        width="1024"
                        height="1536"
                    />
                </div>
                <div className="gate-panel">
                    <form onSubmit={handleSubmit}>
                        <Stack>
                            <h3>Halt Stop!</h3>
                            <TypedPrompt key={promptText} text={promptText} reserveText={GATE_PROMPT} />
                            <TextField
                                type="password"
                                label="Zauberspruch"
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
