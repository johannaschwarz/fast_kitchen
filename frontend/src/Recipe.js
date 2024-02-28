import React, { useEffect, useState } from 'react';
import { ThreeDots } from 'react-loader-spinner';
import { Link, useParams } from 'react-router-dom';

import { API_BASE } from './Config';

import Header from './Header.js';

import './Recipe.css';

function Recipe({ recipe }) {
    const [ingredientMultiplier, setIngredientMultiplier] = useState(1);
    if (recipe === null || recipe.id_ === undefined) {
        return null;
    }

    const deleteRecipe = async () => {
        const response = await fetch(API_BASE + 'recipe/' + recipe.id_, {
            method: 'DELETE'
        })

        if (response.ok) {
            window.location.href = '/';
        }
    }

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
            <div className='recipeSteps'>
                {recipe.steps.map((instruction, index) => (
                    <div key={index} className="recipeStep">
                        <div className="stepCounter">
                            <div className="stepCounterTopLine"></div>
                            <div className="stepCounterCircle">{index + 1}</div>
                            <div className="stepCounterBottomLine"></div>
                        </div>
                        <div className='imageCard recipeStepContent'>
                            {recipe.images.length > 0 &&
                                <img src={API_BASE + "image/" + recipe.images[0]} alt={recipe.name} />
                            }
                            <p>{instruction}</p>
                        </div>
                    </div>
                ))}
            </div>
            <div className='card'>
                {/* TODO: show only to recipe owner */}
                <h2>Options</h2>
                <div className='inlineForm'>
                    <Link to={"/edit/" + recipe.id_} ><button>Edit</button></Link>
                    <button onClick={deleteRecipe}>Delete</button>
                </div>
            </div>
        </div>
    );
}

function RecipePage() {
    const { recipeId } = useParams();
    const [recipe, setRecipe] = useState(null);

    useEffect(() => {
        fetch(API_BASE + 'recipe/specific/' + recipeId)
            .then((response) => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json()
            })
            .then((data) => {
                console.log(data)
                setRecipe(data)
            })
            .catch((err) => {
                console.log(err.message)
                window.location.href = '/';
            });
    }, [recipeId]);

    return (
        <div className="recipePage">
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
