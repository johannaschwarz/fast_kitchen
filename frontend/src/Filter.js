// Filter.js
import React from 'react';
import './Filter.css';

function Filter({ label }) {
    return <span className="filter-chip">{label}</span>;
}

export default Filter;