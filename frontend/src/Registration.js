import { Alert, CircularProgress, Stack, TextField } from "@mui/material";
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import { useContext, useState } from "react";
import { Navigate } from "react-router-dom";
import { API_BASE } from "./Config.js";
import Footer from './Footer.js';
import Header from './Header.js';
import { AuthContext } from "./index";

function Registration() {
    const { isAdmin, token } = useContext(AuthContext);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [newUserIsAdmin, setNewUserIsAdmin] = useState(false);
    const [createUserError, setCreateUserError] = useState('');
    const [createUserInfo, setCreateUserInfo] = useState('');
    const [loading, setLoading] = useState(false);


    if (!isAdmin) {
        return <Navigate to={"/"} />;
    }

    const handleCreation = async (event) => {
        event.preventDefault();
        try {
            setCreateUserError('');
            setCreateUserInfo('');
            setLoading(true);
            const response = await fetch(API_BASE + "user/create", {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + token,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: username,
                    password: password,
                    is_admin: newUserIsAdmin,
                }),
            });
            console.log(newUserIsAdmin);
            if (response.ok) {
                setCreateUserInfo("User created successfully")
            } else {
                const data = await response.json();
                console.log(data);
                setCreateUserError('Login failed: ' + data.detail);
            }
        } catch (err) {
            console.error(err);
            setCreateUserError('Login failed, please try again later.');
        }
        setLoading(false);
    }

    return (
        <div className="main">
            <Header />
            <div className='content'>
                {createUserError && <Alert severity="error">{createUserError}</Alert>}
                {createUserInfo && <Alert severity="info">{createUserInfo}</Alert>}
                <form onSubmit={handleCreation}>
                    <Stack>
                        <h3>Create a user</h3>
                        <TextField type="text" label="Username" value={username} required onChange={(event) => setUsername(event.target.value)} /><br />
                        <TextField type="password" label="Password" value={password} required onChange={(event) => setPassword(event.target.value)} /><br />
                        <FormControlLabel control={<Checkbox checked={newUserIsAdmin} onChange={(e) => setNewUserIsAdmin(e.target.checked)} />} label="Is Admin" /><br />
                        {!loading && <button type="submit" className="btn">Create</button>}
                        {loading && <Stack direction={"row"} alignSelf="center"><CircularProgress /></Stack>}
                    </Stack>
                </form>
            </div>
            <Footer />
        </div >
    )
}

export default Registration;