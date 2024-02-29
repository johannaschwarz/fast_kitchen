// Filters.js
import React from 'react';
import Filter from './Filter';

function Filters() {
    const filters = ['Vegan', 'Vegetarian', 'Quick & Easy'];

    return (
        <div className="filters">
            {filters.map((filter, index) => (
                <Filter key={index} label={filter} />
            ))}
        </div>
    );
}

export default Filters;