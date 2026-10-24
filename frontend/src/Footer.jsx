import { Stack } from "@mui/material";
import { useContext } from "react";
import { Link } from "react-router-dom";
import { FASTKITCHEN_VERSION } from "./Config";
import { AuthContext } from "./index";

function Footer() {
    const { loggedIn, logout, isAdmin } = useContext(AuthContext);
    return (
        <footer>
            <Stack direction={"column"} spacing={2}>
                <Stack direction={"row"} spacing={2} useFlexGap sx={{ flexWrap: 'wrap' }} justifyContent={"center"}>
                    {loggedIn && <span className="link" onClick={logout}>Abmelden</span>}
                    {(loggedIn && isAdmin) && <Link className="link" to="/register">Benutzer anlegen</Link>}
                    <Link className="link" to="/legalnotice">Impressum</Link>
                    <Link className="link" to="/privacy">Datenschutzerklärung</Link>
                </Stack>
                <span>© 2026 FlotteKüche {FASTKITCHEN_VERSION}</span>
            </Stack>
        </footer>
    )
}

export default Footer;
