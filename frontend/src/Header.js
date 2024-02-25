// Header.js
import React from 'react';
import { Link } from 'react-router-dom';

function Header() {
    return (
        <header>
            <h1 id='logo'><Link to="/">FastKitchen</Link></h1>
            <input type="text" id="search-bar" placeholder="Search for recipes" />
            <Link id="create-recipe" to="/create"><button>New Recipe</button></Link>
        </header >
    );
}

export default Header;