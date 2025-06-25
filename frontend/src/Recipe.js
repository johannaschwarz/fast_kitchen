import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined';
import { Stack } from '@mui/material';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
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

    const [wishedPortions, setWishedPortions] = useState(1);
    const [galleryImages, setGalleryImages] = useState([]);
    const [ingredients, setIngredients] = useState([]);

    useEffect(() => {
        if (recipe) {
            setWishedPortions(recipe.portions);
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
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <h2>{recipe.title}</h2>
                    {
                        (isAdmin || parseInt(user) === recipe.creator_id) &&
                        <Stack direction="row" alignItems="center" gap={1}>
                            <IconButton component={Link} to={"/edit/" + recipe.id_} aria-label="edit">
                                <EditIcon />
                            </IconButton>
                            <DeleteAlertDialog recipe_id={recipe.id_} token={token} />
                        </Stack>
                    }
                </Stack>
                <Stack direction="row" alignItems="center" gap={1}>
                    <Chip className='recipeLabel' icon={<TimerOutlinedIcon sx={{ fontSize: 15 }} />} label={recipe.cooking_time + " min"} />
                    {recipe.categories.map((category, index) => (
                        <Chip key={index} className='recipeLabel' label={category} />
                    ))}
                </Stack>
                <p>{recipe.description}</p>
            </div>
            <div className='card'>
                <h2>Ingredients:</h2>
                {console.log(ingredients)}
                {
                    ingredients.map((ingredientGroup, groupIndex) => (
                        <div key={groupIndex}>
                            {ingredients.length > 1 &&
                                <div>
                                    <h3>{ingredientGroup.group}</h3>
                                    <ul>
                                        {ingredientGroup.ingredients.map((ingredient, ingredientIndex) => (
                                            <li key={ingredientIndex}>{ingredient.name}: {Math.round(ingredient.amount * (!isNaN(wishedPortions) ? wishedPortions / recipe.portions : 1) * 10) / 10} {ingredient.unit}</li>
                                        ))}
                                    </ul>
                                </div>
                            }
                            {ingredients.length === 1 &&
                                <ul>
                                    {ingredientGroup.ingredients.map((ingredient, ingredientIndex) => (
                                        <li key={ingredientIndex}>{ingredient.name}: {Math.round(ingredient.amount * (!isNaN(wishedPortions) ? wishedPortions / recipe.portions : 1) * 10) / 10} {ingredient.unit}</li>
                                    ))}
                                </ul>
                            }
                        </div>
                    ))}
                <span>Portions: <input min={1} value={(!isNaN(wishedPortions) ? wishedPortions : "")} onChange={e => setWishedPortions(parseInt(e.target.value))} type='number' /></span>
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
        </div >
    );
}

function DeleteAlertDialog({ recipe_id, token }) {
    const [open, setOpen] = React.useState(false);

    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    const handleDeleteTrue = async () => {
        const response = await fetch(API_BASE + 'recipe/' + recipe_id, {
            method: 'DELETE',
            headers: {
                "Authorization": "Bearer " + token,
            }
        })
        handleClose()
        if (response.ok) {
            window.location.href = '/';
        }
    }

    return (
        <React.Fragment>
            <IconButton onClick={handleClickOpen} aria-label="delete" color="error">
                <DeleteIcon />
            </IconButton>
            <Dialog
                open={open}
                onClose={handleClose}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title" style={{ color: 'var(--text-color)' }}>
                    {"Are you sure you want to delete this recipe?"}
                </DialogTitle>
                <DialogActions>
                    <button onClick={handleDeleteTrue} className="deleteButton">Delete</button>
                    <button onClick={handleClose} autoFocus>
                        No
                    </button>
                </DialogActions>
            </Dialog >
        </React.Fragment >
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
                document.title = "FastKitchen - " + data.title + " Recipe";
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
