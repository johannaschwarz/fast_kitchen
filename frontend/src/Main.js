import React, { useState } from 'react';
import { Link } from "react-router-dom";
import Filters from './Filters.js';
import Header from './Header.js';
import Recipes from './Recipes.js';

function Main() {
  const [filters, setFilters] = useState([]);
  const [search, setSearch] = useState("");

  const setFilter = (label, filter) => {
    if (!filter) {
      setFilters(filters.filter((f) => f !== label));
    } else {
      setFilters([...filters, label]);
    }
  }

  return (
    <div className="Main">
      <Header setSearchInput={setSearch} />
      <div className='content'>
        <Filters setFilter={setFilter} />
        <Recipes filters={filters} search={search} />
        <footer><Link to="/legalnotice">Impressum</Link></footer>
      </div>
    </div>
  );
}

export default Main;
