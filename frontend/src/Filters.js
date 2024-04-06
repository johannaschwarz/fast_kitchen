// Filters.js
import React, { useEffect, useState } from 'react';
import { API_BASE } from './Config';
import Filter from './Filter';

function Filters({ setFilter }) {
    const defaultFilters = ['Vegan', 'Vegetarian', 'Quick & Easy'];
    const [filters, setFilters] = useState(defaultFilters);

    useEffect(() => {
        fetch(API_BASE + 'category/all')
            .then((response) => response.json())
            .then((categories) => {
                let newFilters = [...new Set([...defaultFilters, ...categories])];
                setFilters(newFilters);
            })
            .catch((err) => {
                console.log(err.message);
            });
    });

    return (
        <div className="filters">
            {filters.map((filter, index) => (
                <Filter key={index} label={filter} setFilter={setFilter} />
            ))}
        </div>
    );
}

export default Filters;