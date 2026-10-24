// Filter.js
import React from 'react';
import './Filter.css';

function Filter({ label, active, setFilter }) {
    const handleClick = () => {
        setFilter(label, !active);
    };

    return <span className={"filter-chip" + (active ? " active" : "")} onClick={handleClick}>{label}</span>;
}

export default Filter;
