import RemoveCircleOutlineOutlinedIcon from '@mui/icons-material/RemoveCircleOutlineOutlined';
import { Autocomplete, Stack, TextField } from '@mui/material';
import styled from '@mui/material/styles/styled';
import React, { useEffect, useState } from 'react';
import { ThreeDots } from 'react-loader-spinner';
import { Link, redirect, useParams } from "react-router-dom";
import { API_BASE } from './Config';
import Header from "./Header";

const VisuallyHiddenInput = styled('input')({
    clip: 'rect(0 0 0 0)',
    clipPath: 'inset(50%)',
    height: 1,
    overflow: 'hidden',
    position: 'absolute',
    bottom: 0,
    left: 0,
    whiteSpace: 'nowrap',
    width: 1,
});

function Ingredient({ ingredient, onChangeIngredient, onChangeAmount, onChangeUnit, onDelete }) {
    if (ingredient === null) {
        ingredient = { name: "", amount: 0, unit: "g", group: "" };
    }
    return (
        <div className="formRow inlineForm">
            <input type="text" id="ingredient" name="ingredient" placeholder="Ingredient" onChange={onChangeIngredient} value={ingredient.name} />
            <input min="0" type="number" id="amount" name="amount" placeholder="Amount" onChange={onChangeAmount} value={ingredient.amount} />
            <select id="unit" name="unit" onChange={onChangeUnit} value={ingredient.unit} >
                <option value="g">g</option>
                <option value="kg">kg</option>
                <option value="ml">ml</option>
                <option value="l">l</option>
                <option value="pcs">pcs</option>
                <option value="tbsp">tbsp</option>
                <option value="tsp">tsp</option>
            </select>
            {ingredient.name !== "" && < button type='button' onClick={onDelete} className='clearBtn'><RemoveCircleOutlineOutlinedIcon /></button>}
        </div>
    )
}

const IngredientList = ({ ingredients, setIngredients }) => {
    useEffect(() => {
        // If the last ingredient is filled, add a new empty ingredient
        if (ingredients[ingredients.length - 1].name !== "") {
            setIngredients([...ingredients, { name: "", amount: 0, unit: "g", group: "" }]);
        }
        // If there are two empty ingredients at the end, remove the last one
        else if (ingredients.length > 1 && ingredients[ingredients.length - 2].name === "") {
            setIngredients(ingredients.slice(0, -1));
        }
    }, [ingredients, setIngredients]);

    const handleIngredientChange = (index, key) => (event) => {
        const newIngredients = [...ingredients];
        if (key === "amount") {
            newIngredients[index][key] = parseFloat(event.target.value);
        } else {
            newIngredients[index][key] = event.target.value;
        }
        setIngredients(newIngredients);
    };

    const handleDeleteIngredient = (index) => (_event) => {
        const newIngredients = [...ingredients];
        newIngredients.splice(index, 1);
        setIngredients(newIngredients);
    }

    return (
        <div>
            {ingredients.map((ingredient, index) => (
                <Ingredient
                    key={index}
                    ingredient={ingredient}
                    onChangeIngredient={handleIngredientChange(index, "name")}
                    onChangeAmount={handleIngredientChange(index, "amount")}
                    onChangeUnit={handleIngredientChange(index, "unit")}
                    onDelete={handleDeleteIngredient(index)}
                />
            ))}
        </div>
    );
};

function Step({ index, step, onChangeDesciption, onChangeDuration, onDelete }) {
    return (
        <div className='formRow inlineForm'>
            <span>{index}.</span>
            <textarea type="text" id="step" name="step" placeholder="Instruction" onChange={onChangeDesciption} value={step.description}></textarea>
            {step.description !== "" && < button type='button' onClick={onDelete} className='clearBtn'><RemoveCircleOutlineOutlinedIcon /></button>}
        </div>
    )
}

const StepsList = ({ steps, setSteps }) => {
    useEffect(() => {
        // If the last step is filled, add a new empty step
        if (steps[steps.length - 1].description !== "") {
            setSteps([...steps, { description: "", duration: 0 }]);
        }
        // If there are two empty steps at the end, remove the last one
        else if (steps.length > 1 && steps[steps.length - 2].description === "") {
            setSteps(steps.slice(0, -1));
        }
    }, [steps, setSteps]);

    const handleStepChange = (index, key) => (event) => {
        const newSteps = [...steps];
        newSteps[index][key] = event.target.value;
        setSteps(newSteps);
    };

    const handleDeleteStep = (index) => (_event) => {
        const newSteps = [...steps];
        newSteps.splice(index, 1);
        setSteps(newSteps);
    }

    return (
        <div>
            {steps.map((step, index) => (
                <Step
                    key={index}
                    index={index + 1}
                    step={step}
                    onChangeDesciption={handleStepChange(index, "description")}
                    onChangeDuration={handleStepChange(index, "duration")}
                    onDelete={handleDeleteStep(index)}
                />
            ))}
        </div>
    );
};

const defaultFilters = ['Vegan', 'Vegetarian', 'Quick & Easy'];
function RecipeEditor() {
    const { recipeId } = useParams();
    const [ingredients, setIngredients] = useState([{ name: "", amount: 0, unit: "g", group: "" }]);
    const [steps, setSteps] = useState([{ description: "", duration: 0 }]);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [cookingTime, setCookingTime] = useState(20);
    const [portions, setPortions] = useState(1);
    const [categories, setCategories] = useState([]);
    const [coverImage, setCoverImage] = useState("");
    const [images, setImages] = useState([]);
    const [storing, setStoring] = useState(false);
    const [loaded, setLoaded] = useState(false);

    const [filters, setFilters] = useState(defaultFilters);

    useEffect(() => {
        fetch(API_BASE + 'category/all')
            .then((response) => response.json())
            .then((all_categories) => {
                let newFilters = [...new Set([...defaultFilters, ...all_categories])];
                setFilters(newFilters);
            })
            .catch((err) => {
                console.log(err.message);
            });
    }, []);

    useEffect(() => {
        if (recipeId === undefined) {
            return;
        }
        fetch(API_BASE + 'recipe/specific/' + recipeId)
            .then((response) => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json()
            })
            .then((data) => {
                setTitle(data.title);
                setDescription(data.description);
                setCategories(data.categories);
                setPortions(data.portions);
                setCookingTime(data.cooking_time);
                setIngredients(data.ingredients.map(ingredient => ({ name: ingredient.name, amount: ingredient.amount, unit: ingredient.unit })));
                setSteps(data.steps.map(step => ({ description: step, duration: 0 })));
                setImages(data.images);
                setCoverImage(data.cover_image);
                setLoaded(true);
            })
            .catch((err) => {
                console.log(err.message)
                window.location.href = '/';
            });
    }, [recipeId]);

    //TODO: add form to upload more images
    const uploadImage = async (file) => {
        const formData = new FormData();
        formData.append('image', file);

        const response = await fetch(API_BASE + 'image/create', {
            method: 'POST',
            body: formData,
        });

        if (response.ok) {
            const data = await response.json();
            setImages([...images, data.id_]);
            return data.id_;
        } else {
            console.error('Image upload failed');
        }
    }

    const handleSubmit = async (event) => {
        event.preventDefault();

        setStoring(true);

        var data = {
            title: title,
            description: description,
            categories: categories.map(category => category.trim()),
            portions: portions,
            cooking_time: cookingTime,
            ingredients: ingredients.filter(ingredient => ingredient.name !== ""),
            steps: steps.filter(step => step.description !== "").map(step => step.description),
            cover_image: coverImage,
        }
        if (recipeId !== undefined)
            data.id_ = recipeId;

        if (images.length > 0)
            data.images = images;

        console.log(data)

        // Post form data
        const response = await fetch(API_BASE + (recipeId === undefined ? 'recipe/create' : 'recipe/' + recipeId), {
            method: recipeId === undefined ? 'POST' : 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        setStoring(false);

        if (response.ok) {
            const responseData = await response.json();
            const createdRecipeId = responseData.id_;

            console.log('Form submitted successfully');
            return redirect("/recipe/" + createdRecipeId);
        } else {
            response.text().then(text => console.log(text));
            console.error('Form submission failed');
        }
    };

    const uploadImageOnChange = async (event) => {
        const file = event.target.files[0];
        setImages([file]);
    }

    const uploadCoverImageOnChange = async (event) => {
        const file = event.target.files[0];
        uploadImage(file).then(id_ => setCoverImage(id_));
    }

    return (
        <div>
            <Header />
            <div className={"content " + (storing || (recipeId !== undefined && !loaded) ? 'hidden' : '')}>
                <h1>{recipeId === undefined ? "Create a new recipe" : "Edit your recipe"}</h1>
                <form onSubmit={handleSubmit}>
                    <Stack>
                        {/* TODO: consider using https://mui.com/material-ui/react-text-field/ instead of input */}
                        <TextField id="title" name="title" label="Title" value={title} onChange={e => setTitle(e.target.value)} required /><br />
                        <TextField id="description" name="description" label="Description" value={description} onChange={e => setDescription(e.target.value)} required /><br />
                        <TextField id="cookingTime" name="cookingTime" label="Cooking time in minutes" type="number" value={cookingTime} onChange={e => setCookingTime(e.target.value)} required /><br />
                        <Autocomplete
                            disablePortal
                            options={filters}
                            sx={{ width: 300 }}
                            freeSolo
                            multiple
                            value={categories}
                            onChange={(_, value) => { setCategories(value) }}
                            renderInput={(params) => <TextField {...params} label="Categories" />}
                        /><br />

                        <label className="btn" htmlFor="cover_image">Upload cover image
                            <VisuallyHiddenInput type="file" id="cover_image" name="cover_image" accept="image/*" onChange={uploadCoverImageOnChange} />
                        </label><br />
                        <span id="cover-image-chosen">{coverImage && document.getElementById("cover_image").files.length > 0 ? "Cover-Image: " + document.getElementById("cover_image").files[0].name : "No file chosen"}</span><br />

                        <h3>Ingredients:</h3>
                        <div>
                            <IngredientList ingredients={ingredients} setIngredients={setIngredients} />
                            <label htmlFor="portions">Portions:</label><br />
                            <input min="1" type="number" id="portions" name="portions" placeholder="Portions" onChange={e => setPortions(e.target.value)} required /><br />
                        </div>
                        <h3>Steps:</h3>
                        <div>
                            <StepsList steps={steps} setSteps={setSteps} />
                        </div>
                        <br />
                        <button type="submit">{recipeId === undefined ? "Create" : "Change"}</button><br />
                    </Stack>
                </form>
            </div>

            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
            }}>
                <ThreeDots
                    visible={storing || (recipeId !== undefined && !loaded)}
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
    )
}

export default RecipeEditor;