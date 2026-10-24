import React from 'react';
import { useSearchParams } from 'react-router-dom';
import Filters from './Filters.jsx';
import Footer from './Footer.jsx';
import Header from './Header.jsx';
import Recipes from './Recipes.jsx';
import { parseRecipeListParams } from './recipeListParams.js';

function Main() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { filters, search, sortByOption, sortOrder } = parseRecipeListParams(searchParams);

  const setParam = (name, value) => {
    setSearchParams((previous) => {
      const params = new URLSearchParams(previous);
      params.delete(name);
      const values = Array.isArray(value) ? value : [value];
      values.filter(Boolean).forEach((item) => params.append(name, item));
      return params;
    }, { replace: true });
  };

  const setFilter = (label, filter) => {
    setParam('categories', filter ? [...filters, label] : filters.filter((f) => f !== label));
  }

  return (
    <div className="main">
      <Header searchInput={search} setSearchInput={(value) => setParam('search', value)} />
      <div className='content'>
        <Filters activeFilters={filters} setFilter={setFilter} />
        <Recipes
          filters={filters}
          search={search}
          sortByOption={sortByOption}
          sortOrder={sortOrder}
          setSortByOption={(value) => setParam('sort_by', value)}
          setSortOrder={(value) => setParam('sort_order', value)}
        />
      </div>
      <Footer />
    </div>
  );
}

export default Main;
