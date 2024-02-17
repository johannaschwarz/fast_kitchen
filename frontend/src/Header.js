// Header.js
import React from 'react';

function Header() {
    return (
        <header>
            <h1>FastKitchen</h1>
            <form id="search-form">
                <input type="text" id="search-bar" placeholder="Search for recipes" />
            </form>
        </header>
    );
}

export default Header;