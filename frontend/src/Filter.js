// Filter.js
import React, { useState } from 'react';
import './Filter.css';

function Filter({ label, setFilter }) {
    const [active, setActive] = useState(false);

    const handleClick = () => {
        setActive(!active);
        setFilter(label, !active);
    };

    return <span className={"filter-chip" + (active ? " active" : "")} onClick={handleClick}>{label}</span>;
}

export default Filter;