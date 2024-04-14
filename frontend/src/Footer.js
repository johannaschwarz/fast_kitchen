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
                <Stack direction={"row"} spacing={2} justifyContent={"center"}>
                    {loggedIn && <span className="link" onClick={logout}>Log out</span>}
                    {(loggedIn && isAdmin) && <Link className="link" to="/register">Create user</Link>}
                    <Link className="link" to="/legalnotice">Legal notice</Link>
                </Stack>
                <span>© 2024 FastKitchen {FASTKITCHEN_VERSION}</span>
            </Stack>
        </footer>
    )
}

export default Footer;