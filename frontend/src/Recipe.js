import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined';
import { Stack } from '@mui/material';
import React, { useContext, useEffect, useState } from 'react';
import { ThreeDots } from 'react-loader-spinner';
import Carousel from 'react-material-ui-carousel';
import { Link, useParams } from 'react-router-dom';
import { API_BASE } from './Config';
import Footer from './Footer.js';
import Header from './Header.js';
import './Recipe.css';
import { AuthContext } from './index';

function Recipe({ recipe }) {
    const { token, user, isAdmin } = useContext(AuthContext);

    const [ingredientMultiplier, setIngredientMultiplier] = useState(1);
    const [galleryImages, setGalleryImages] = useState([]);
    const [ingredients, setIngredients] = useState([]);

    useEffect(() => {
        if (recipe) {
            if (recipe.cover_image === null) {
                setGalleryImages(recipe.gallery_images);
            } else {
                setGalleryImages([recipe.cover_image, ...recipe.gallery_images]);
            }

            let newIngredients = []
            for (let i = 0; i < recipe.ingredients.length; i++) {
                let groupIndex = newIngredients.findIndex(group => group.group === recipe.ingredients[i].group);
                if (groupIndex === -1) {
                    newIngredients.push({ group: recipe.ingredients[i].group, ingredients: [] });
                    groupIndex = newIngredients.length - 1;
                }
                newIngredients[groupIndex].ingredients.push({
                    name: recipe.ingredients[i].name,
                    amount: recipe.ingredients[i].amount,
                    unit: recipe.ingredients[i].unit,
                });
            }
            setIngredients(newIngredients);
        }
    }, [recipe]);

    if (recipe === null || recipe.id_ === undefined) {
        return null;
    }

    const deleteRecipe = async () => {
        const response = await fetch(API_BASE + 'recipe/' + recipe.id_, {
            method: 'DELETE',
            headers: {
                "Authorization": "Bearer " + token,
            }
        })

        if (response.ok) {
            window.location.href = '/';
        }
    }

    return (
        <div>
            <div className='imageCard'>
                {galleryImages.length > 0 &&
                    <Carousel>
                        {galleryImages.map((image, index) =>
                            <img key={index} className="carousel-image" src={API_BASE + "image/" + image} alt={recipe.name} />
                        )}
                    </Carousel>
                }
                <h2>{recipe.title}</h2>
                <Stack direction="row" alignItems="center" gap={1}>
                    <span className="label">
                        <Stack direction="row" alignItems="center" gap={1}>
                            <TimerOutlinedIcon sx={{ fontSize: 15 }} />
                            <span>{recipe.cooking_time} min</span>
                        </Stack>
                    </span>

                    {recipe.categories.map((category, index) => (
                        <span className="label" key={index}>{category}</span>
                    ))}
                </Stack>
                <p>{recipe.description}</p>
            </div>
            <div className='card'>
                <h2>Ingredients:</h2>
                {ingredients.map((ingredientGroup, groupIndex) => (
                    <div key={groupIndex}>
                        {ingredients.length > 1 &&
                            <div>
                                <h3>{ingredientGroup.group}</h3>
                                <ul>
                                    {ingredientGroup.ingredients.map((ingredient, ingredientIndex) => (
                                        <li key={ingredientIndex}>{ingredient.name}: {ingredient.amount * (!isNaN(ingredientMultiplier) ? ingredientMultiplier : 1)} {ingredient.unit}</li>
                                    ))}
                                </ul>
                            </div>
                        }
                        {ingredients.length === 1 &&
                            <ul>
                                {ingredientGroup.ingredients.map((ingredient, ingredientIndex) => (
                                    <li key={ingredientIndex}>{ingredient.name}: {ingredient.amount * (!isNaN(ingredientMultiplier) ? ingredientMultiplier : 1)} {ingredient.unit}</li>
                                ))}
                            </ul>
                        }
                    </div>
                ))}
                <span>Portions: <input min={1} value={(!isNaN(ingredientMultiplier) ? ingredientMultiplier : "")} onChange={e => setIngredientMultiplier(parseInt(e.target.value))} type='number' /></span>
            </div>
            <div className='recipeSteps'>
                {recipe.steps.sort(function (a, b) {
                    if (a.order_id < b.order_id) return -1
                    if (a.order_id > b.order_id) return 1
                    return 0
                }).map((step, index) => (
                    <div key={index} className="recipeStep">
                        <div className="stepCounter">
                            <div className="stepCounterTopLine"></div>
                            <div className="stepCounterCircle">{index + 1}</div>
                            <div className="stepCounterBottomLine"></div>
                        </div>
                        <div className='imageCard recipeStepContent'>
                            {step.images.length > 0 && <Carousel autoPlay={false} className="recipeStepCarousel">
                                {step.images.map((image, imgIndex) => (
                                    <img key={imgIndex} className="carousel-image" src={API_BASE + "image/" + image} alt={"Step" + index + " image " + imgIndex} />
                                ))}
                            </Carousel>}
                            <span className="instructionText">{step.step}</span>
                        </div>
                    </div>
                ))}
            </div>
            {
                (isAdmin || user === recipe.creator_id) &&
                <div className='card'>
                    <h2>Options</h2>
                    <div className='inlineForm'>
                        <Link to={"/edit/" + recipe.id_} ><button>Edit</button></Link>
                        <button onClick={deleteRecipe}>Delete</button>
                    </div>
                </div>
            }
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
        <div className="recipePage main">
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
            <Footer />
        </div>
    );
}

export default RecipePage;
