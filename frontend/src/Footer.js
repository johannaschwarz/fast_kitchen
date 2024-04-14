import { useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "./index";

function Footer() {
    const { logout } = useContext(AuthContext);
    return (
        <footer>
            <a onClick={logout}>Log out</a>
            <Link to="/legalnotice">Legal notice</Link>
        </footer>
    )
}

export default Footer;