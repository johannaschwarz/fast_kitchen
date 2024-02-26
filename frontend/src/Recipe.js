import React, { useEffect, useState } from 'react';
import { ThreeDots } from 'react-loader-spinner';
import { useParams } from 'react-router-dom';
import { API_BASE } from './Config';

import Header from './Header.js';

import './Recipe.css';

function Recipe(props) {
    const [ingredientMultiplier, setIngredientMultiplier] = useState(1);
    if (props.recipe === null) {
        return null;
    }
    const recipe = props.recipe;

    return (
        <div>
            <div className='imageCard'>
                {recipe.images.length > 0 &&
                    <img src={API_BASE + "image/" + recipe.images[0]} alt={recipe.name} />
                }
                <h2>{recipe.title}</h2>

                {recipe.categories.map((category, index) => (
                    <span className="label" key={index}>{category}</span>
                ))}
            </div>
            <div className='card'>{recipe.description}</div>
            <div className='card'>
                <h2>Ingredients:</h2>
                <ul>
                    {recipe.ingredients.map((ingredient, index) => (
                        <li key={index}>{ingredient}: {5 * (!isNaN(ingredientMultiplier) ? ingredientMultiplier : 1)} g</li>
                    ))}
                </ul>
                <span>Portionen: <input min={1} value={(!isNaN(ingredientMultiplier) ? ingredientMultiplier : "")} onChange={e => setIngredientMultiplier(parseInt(e.target.value))} type='number' /></span>
            </div>
            <div className='card'>
                <h2>Instructions:</h2>
                <ol>
                    {recipe.steps.map((instruction, index) => (
                        <li key={index}>{instruction}</li>
                    ))}
                </ol>
            </div>
        </div>
    );
}

function RecipePage() {
    const { recipeId } = useParams();
    const [recipe, setRecipe] = useState(null);

    useEffect(() => {
        fetch(API_BASE + 'recipe/specific/' + recipeId)
            .then((response) => response.json())
            .then((data) => {
                console.log(data)
                setRecipe(data)
            })
            .catch((err) => {
                console.log(err.message)
            });
    }, [recipeId]);

    return (
        <div>
            <Header />
            <div className='content'>
                <Recipe recipe={recipe} />
            </div>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
            }}>
                <ThreeDots
                    visible={recipe === null}
                    height="80"
                    width="80"
                    color="#4fa94d"
                    radius="9"
                    ariaLabel="three-dots-loading"
                    wrapperStyle={{}}
                    wrapperClass=""
                />
            </div>
        </div>
    );
}

export default RecipePage;
