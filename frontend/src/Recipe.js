import React, { useEffect, useState } from 'react';
import { ThreeDots } from 'react-loader-spinner';
import { Link, useParams } from 'react-router-dom';
import Carousel from 'react-material-ui-carousel';
import { API_BASE } from './Config';

import Header from './Header.js';

import './Recipe.css';

function Recipe({ recipe }) {
    const [ingredientMultiplier, setIngredientMultiplier] = useState(1);
    const [gallery_images, setGalleryImages] = useState([]);

    useEffect(() => {
        if (recipe) {
            setGalleryImages([recipe.cover_image, ...recipe.gallery_images]);
        }
    }, [recipe]);

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
                {recipe.gallery_images.length > 0 &&
                    <Carousel>
                        {gallery_images.map((image, _) =>
                            <img class="carousel-image" src={API_BASE + "image/" + image} alt={recipe.name} />
                        )}
                    </Carousel>
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
                        <li key={index}>{ingredient.name}: {ingredient.amount * (!isNaN(ingredientMultiplier) ? ingredientMultiplier : 1)} {ingredient.unit}</li>
                    ))}
                </ul>
                <span>Portionen: <input min={1} value={(!isNaN(ingredientMultiplier) ? ingredientMultiplier : "")} onChange={e => setIngredientMultiplier(parseInt(e.target.value))} type='number' /></span>
            </div>
            <div className='recipeSteps'>
                {recipe.steps.map((step, index) => (
                    <div key={index} className="recipeStep">
                        <div className="stepCounter">
                            <div className="stepCounterTopLine"></div>
                            <div className="stepCounterCircle">{index + 1}</div>
                            <div className="stepCounterBottomLine"></div>
                        </div>
                        <div className='imageCard recipeStepContent'>
                            {step.images.map((image, _) => (
                                <img src={API_BASE + "image/" + image} alt={"step image"} />)
                            )}
                            <span className="instructionText">{step.step}</span>
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
                    color="var(--dark-green)"
                    radius="9"
                    ariaLabel="three-dots-loading"
                    wrapperStyle={{}}
                    wrapperClass=""
                />
            </div>
            <footer><Link to="/legalnotice">Impressum</Link></footer>
        </div>
    );
}

export default RecipePage;
