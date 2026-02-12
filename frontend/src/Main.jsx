import React, { useState } from 'react';
import Filters from './Filters.jsx';
import Footer from './Footer.jsx';
import Header from './Header.jsx';
import Recipes from './Recipes.jsx';

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
    <div className="main">
      <Header setSearchInput={setSearch} />
      <div className='content'>
        <Filters setFilter={setFilter} />
        <Recipes filters={filters} search={search} />
      </div>
      <Footer />
    </div>
  );
}

export default Main;
