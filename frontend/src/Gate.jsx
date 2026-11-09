import { CircularProgress, Stack, TextField } from '@mui/material';
import { useContext, useEffect, useState } from 'react';
import { API_BASE } from './Config';
import Footer from './Footer.jsx';
import Header from './Header.jsx';
import { AuthContext } from './index.jsx';
import './Gate.css';

const GATE_PROMPT = 'Bitte gib zuerst den geheimen Zauberspruch ein, um das Portal zur unerschöpflichen Quelle kulinarischer Schriften freizuschalten.';
const FAILED_ATTEMPT_MESSAGES = [
    'Hm. Das war’s nicht. Der Große Gärtner hebt skeptisch eine Augenbraue.',
    'Immer noch falsch. Das riecht langsam nach einer Abmahnung – gärtnerisch, versteht sich.',
    'Nein. Der Große Gärtner hat das Abmahnungsformular bereits aus der Schublade geholt.',
    'Falsch. Eine Abmahnung wegen wiederholter Zauberspruchverletzung ist schon in Arbeit.',
];
const RATE_LIMIT_MESSAGE = 'Jetzt reicht’s. Der Große Gärtner hat die Abmahnung bereits unterschrieben. Bitte versuche es später noch einmal.';
const CONNECTION_ERROR_MESSAGE = 'Der Große Gärtner schaut verwirrt. Das Portal antwortet gerade nicht. Bitte versuche es später erneut.';

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
                        src="/le-grand-gardien.png"
                        alt="Le Grand Gardien, Wächter der Rezepte"
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
