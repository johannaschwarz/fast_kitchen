import Filters from './Filters.js';
import Header from './Header.js';
import Recipes from './Recipes.js';

function Main() {
  return (
    <div className="Main">
      <Header />
      <main>
        <Filters />
        <Recipes />
      </main>
    </div>
  );
}

export default Main;
