// Filters.js
import React, { useEffect, useState } from 'react';
import { API_BASE } from './Config';
import Filter from './Filter';
import { recipeCategories } from './recipeListParams.js';

const defaultFilters = ['Vegan', 'Vegetarisch'];
function Filters({ activeFilters, setFilter }) {
    const [filters, setFilters] = useState(defaultFilters);

    useEffect(() => {
        fetch(API_BASE + 'category/all')
            .then((response) => response.json())
            .then((categories) => {
                let newFilters = [...new Set([...defaultFilters, ...categories])]
                    .filter((category) => recipeCategories.includes(category));
                setFilters(newFilters);
            })
            .catch((err) => {
                console.log(err.message);
            });
    }, []);

    return (
        <div className="filters">
            {filters.map((filter, index) => (
                <Filter key={index} label={filter} active={activeFilters.includes(filter)} setFilter={setFilter} />
            ))}
        </div>
    );
}

export default Filters;
