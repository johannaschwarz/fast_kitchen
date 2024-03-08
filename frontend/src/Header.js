// Header.js
import React from 'react';
import { Link } from 'react-router-dom';

function Header() {
    return (
        <header>
            <div id="logo">
                <Link to="/"><img src="/logo_text.png" alt="Fast Kitchen" /></Link>
            </div>
            <input type="text" id="search-bar" placeholder="Search for recipes" />
            <Link id="create-recipe" to="/create"><button>New Recipe</button></Link>
        </header >
    );
}

export default Header;