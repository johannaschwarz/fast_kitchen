import { Link, useParams } from 'react-router-dom';

function Recipe() {
    const { recipeId } = useParams();
    return (
        <div>

            <header>
                <h1>FastKitchen - Flammkuchen</h1>
            </header>
            <Link to="/">Back</Link>
            <h1>I'm a recipe ({recipeId})!</h1>
        </div>
    );
}

export default Recipe;
