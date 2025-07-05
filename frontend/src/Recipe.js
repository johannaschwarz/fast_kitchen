import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined';
import { Stack } from '@mui/material';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import React, { useContext, useEffect, useState, useMemo } from 'react';
import { ThreeDots } from 'react-loader-spinner';
import Carousel from 'react-material-ui-carousel';
import { Link, useParams } from 'react-router-dom';
import { API_BASE } from './Config';
import Footer from './Footer.js';
import Header from './Header.js';
import './Recipe.css';
import { AuthContext } from './index';

// Constants
const ROUNDING_PRECISION = 10;
const DECIMAL_PLACES = 2;
const WARNING_MESSAGES = {
    INVALID_NUMBER: 'Please enter a valid number',
    AMOUNT_TOO_SMALL: 'Amount must be greater than 0',
    PORTIONS_TOO_SMALL: 'Portions must be greater than 0'
};

function Recipe({ recipe }) {
    const { token, user, isAdmin } = useContext(AuthContext);

    const [wishedPortions, setWishedPortions] = useState(1);
    const [galleryImages, setGalleryImages] = useState([]);
    const [ingredients, setIngredients] = useState([]);
    const [customAmounts, setCustomAmounts] = useState({});
    const [editingIngredient, setEditingIngredient] = useState(null);
    const [editingPortions, setEditingPortions] = useState(false);
    const [warnings, setWarnings] = useState({});

    // Memoized ingredient grouping
    const groupedIngredients = useMemo(() => {
        if (!recipe?.ingredients) return [];

        const groups = {};
        recipe.ingredients.forEach((ingredient, index) => {
            const group = ingredient.group || 'Main';
            if (!groups[group]) {
                groups[group] = [];
            }
            groups[group].push({
                ...ingredient,
                id: `${group}-${index}`
            });
        });

        return Object.entries(groups).map(([groupName, groupIngredients]) => ({
            group: groupName,
            ingredients: groupIngredients
        }));
    }, [recipe?.ingredients]);

    useEffect(() => {
        if (recipe) {
            setWishedPortions(recipe.portions);
            setGalleryImages(recipe.cover_image === null
                ? recipe.gallery_images
                : [recipe.cover_image, ...recipe.gallery_images]
            );
            setIngredients(groupedIngredients);
            setCustomAmounts({});
            setWarnings({});
        }
    }, [recipe, groupedIngredients]);

    const calculateAmount = (ingredient, portions) => {
        const baseAmount = ingredient.amount;
        const ratio = portions / recipe.portions;
        return Math.round(baseAmount * ratio * ROUNDING_PRECISION) / ROUNDING_PRECISION;
    };

    const roundToDecimals = (value) => {
        return Math.round(value * Math.pow(10, DECIMAL_PLACES)) / Math.pow(10, DECIMAL_PLACES);
    };

    const handleIngredientAmountChange = (ingredientId, inputValue) => {
        const ingredient = findIngredientById(ingredientId);
        if (!ingredient) return;

        setCustomAmounts(prev => ({
            ...prev,
            [ingredientId]: inputValue
        }));
    };

    const clearWarning = (key) => {
        setWarnings(prev => {
            const newWarnings = { ...prev };
            delete newWarnings[key];
            return newWarnings;
        });
    };

    const setWarning = (key, message) => {
        setWarnings(prev => ({
            ...prev,
            [key]: message
        }));
    };

    const validateAndApplyIngredientChange = (ingredientId) => {
        const ingredient = findIngredientById(ingredientId);
        if (!ingredient) return;

        const inputValue = String(customAmounts[ingredientId] || '');
        clearWarning(ingredientId);

        // Handle empty or partial decimal input
        if (inputValue === '' || inputValue === '.' || inputValue.endsWith('.') || inputValue === '0.') {
            return;
        }

        const newAmount = parseFloat(inputValue);
        if (isNaN(newAmount)) {
            setWarning(ingredientId, WARNING_MESSAGES.INVALID_NUMBER);
            return;
        }

        if (newAmount <= 0) {
            setWarning(ingredientId, WARNING_MESSAGES.AMOUNT_TOO_SMALL);
            return;
        }

        // Valid input - apply changes
        const newPortions = (newAmount / ingredient.amount) * recipe.portions;
        setWishedPortions(newPortions);

        // Update custom amounts for other ingredients
        const newCustomAmounts = {};
        ingredients.forEach(group => {
            group.ingredients.forEach(ing => {
                if (ing.id !== ingredientId) {
                    newCustomAmounts[ing.id] = calculateAmount(ing, newPortions);
                }
            });
        });
        setCustomAmounts(newCustomAmounts);
    };

    const findIngredientById = (ingredientId) => {
        for (const group of ingredients) {
            for (const ingredient of group.ingredients) {
                if (ingredient.id === ingredientId) {
                    return ingredient;
                }
            }
        }
        return null;
    };

    const getDisplayAmount = (ingredient) => {
        // If there are any warnings, show 0 for all ingredients
        if (Object.keys(warnings).length > 0) {
            return 0;
        }

        if (customAmounts[ingredient.id] !== undefined) {
            return customAmounts[ingredient.id];
        }
        return calculateAmount(ingredient, wishedPortions);
    };

    const getDisplayAmountForInput = (ingredient) => {
        if (customAmounts[ingredient.id] !== undefined) {
            return customAmounts[ingredient.id];
        }
        return calculateAmount(ingredient, wishedPortions);
    };

    const getDisplayPortionsForInput = () => {
        if (wishedPortions === '') return "";
        return wishedPortions;
    };

    const getDisplayPortions = () => {
        // If there are any warnings, show 0 for portions
        if (Object.keys(warnings).length > 0) {
            return 0;
        }

        if (wishedPortions <= 0) return 0;
        return roundToDecimals(wishedPortions);
    };

    const handlePortionsChange = (inputValue) => {
        setWishedPortions(inputValue);
    };

    const validateAndApplyPortionsChange = () => {
        const inputValue = String(wishedPortions);
        clearWarning('portions');

        // Handle empty or partial decimal input
        if (inputValue === '' || inputValue === '.' || inputValue.endsWith('.') || inputValue === '0.') {
            return;
        }

        const newPortions = parseFloat(inputValue);
        if (isNaN(newPortions)) {
            setWarning('portions', WARNING_MESSAGES.INVALID_NUMBER);
            return;
        }

        if (newPortions <= 0) {
            setWarning('portions', WARNING_MESSAGES.PORTIONS_TOO_SMALL);
            return;
        }

        // Valid input - apply changes
        setWishedPortions(newPortions);
        setCustomAmounts({}); // Reset custom amounts when portions change
    };

    const renderIngredientInput = (ingredient) => (
        <div className="ingredient-row">
            <div className="ingredient-amount-and-name">
                {editingIngredient === ingredient.id && (
                    <input
                        type="text"
                        inputMode="decimal"
                        value={getDisplayAmountForInput(ingredient)}
                        onChange={(e) => handleIngredientAmountChange(ingredient.id, e.target.value)}
                        onBlur={() => {
                            validateAndApplyIngredientChange(ingredient.id);
                            setEditingIngredient(null);
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                validateAndApplyIngredientChange(ingredient.id);
                                setEditingIngredient(null);
                            }
                        }}
                        autoFocus
                        className="amount-input"
                    />
                )}
                {!(editingIngredient === ingredient.id) && (
                    <div className="ingredient-amount">
                        <span
                            className="clickable-amount"
                            onClick={() => setEditingIngredient(ingredient.id)}
                        >
                            {getDisplayAmount(ingredient)} {ingredient.unit}
                        </span>
                    </div>
                )}
                <div className="ingredient-name-container">
                    <span className="ingredient-name">{ingredient.name}</span>
                </div>
            </div>
            {warnings[ingredient.id] && (
                <div className="warning-message">
                    {warnings[ingredient.id]}
                </div>
            )}
        </div>
    );

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
                <p className='recipeDescription'>{recipe.description}</p>
            </div>
            <div className='card'>
                <h2>Ingredients:</h2>
                <div className="ingredients-list">
                    <div className="portions-row">
                        <div className="portions-amount-and-label">
                            {editingPortions && (
                                <input
                                    type="text"
                                    inputMode="decimal"
                                    value={getDisplayPortionsForInput()}
                                    onChange={e => handlePortionsChange(e.target.value)}
                                    onBlur={() => {
                                        validateAndApplyPortionsChange();
                                        setEditingPortions(false);
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            validateAndApplyPortionsChange();
                                            setEditingPortions(false);
                                        }
                                    }}
                                    autoFocus
                                    className="portions-input"
                                />
                            )}
                            {!editingPortions && (
                                <div className="portions-amount">
                                    <span
                                        className="clickable-portions"
                                        onClick={() => setEditingPortions(true)}
                                    >
                                        {getDisplayPortions()}
                                    </span>
                                </div>
                            )}
                            <div className="portions-label-container">
                                <span className="portions-label">Portions</span>
                            </div>
                        </div>

                        {warnings['portions'] && (
                            <div className="warning-message">
                                {warnings['portions']}
                            </div>
                        )}
                    </div>
                    {
                        ingredients.map((ingredientGroup, groupIndex) => (
                            <div key={groupIndex}>
                                {ingredients.length > 1 &&
                                    <div>
                                        <h3>{ingredientGroup.group}</h3>
                                        {ingredientGroup.ingredients.map((ingredient, ingredientIndex) => (
                                            <div key={ingredientIndex} className="ingredient-item">
                                                {renderIngredientInput(ingredient)}
                                            </div>
                                        ))}
                                    </div>
                                }
                                {ingredients.length === 1 &&
                                    <div >

                                        {ingredientGroup.ingredients.map((ingredient, ingredientIndex) => (
                                            <div key={ingredientIndex} className="ingredient-item">
                                                {renderIngredientInput(ingredient)}
                                            </div>
                                        ))}
                                    </div>
                                }

                            </div>
                        ))}
                </div>


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
