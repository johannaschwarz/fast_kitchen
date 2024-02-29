import Filters from './Filters.js';
import Header from './Header.js';
import Recipes from './Recipes.js';

function Main() {
  return (
    <div className="Main">
      <Header />
      <div className='content'>
        <Filters />
        <Recipes />
      </div>
    </div>
  );
}

export default Main;
