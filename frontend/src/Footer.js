import { Stack } from "@mui/material";
import { useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "./index";

function Footer() {
    const { logout } = useContext(AuthContext);
    return (
        <footer>
            <Stack>
                <span className="link" onClick={logout}>Log out</span>
                <Link to="/legalnotice">Legal notice</Link>
            </Stack>
        </footer>
    )
}

export default Footer;