import RemoveCircleOutlineOutlinedIcon from '@mui/icons-material/RemoveCircleOutlineOutlined';
import React, { useEffect, useState } from 'react';
import { ThreeDots } from 'react-loader-spinner';
import { redirect, useParams } from "react-router-dom";
import { API_BASE } from './Config';
import Header from "./Header";
function Ingredient({ ingredient, onChangeIngredient, onChangeAmount, onChangeUnit, onDelete }) {
    if (ingredient === null) {
        ingredient = { name: "", amount: "", unit: "" };
    }
    return (
        <div className="formRow inlineForm">
            <input type="text" id="ingredient" name="ingredient" placeholder="Ingredient" onChange={onChangeIngredient} value={ingredient.name} />
            <input min="0" type="number" id="amount" name="amount" placeholder="Amount" onChange={onChangeAmount} value={ingredient.amount} />
            <select id="unit" name="unit" onChange={onChangeUnit} value={ingredient.unit}>
                <option value="g">g</option>
                <option value="kg">kg</option>
                <option value="ml">ml</option>
                <option value="l">l</option>
                <option value="pcs">pcs</option>
            </select>
            {ingredient.name !== "" && < button type='button' onClick={onDelete} className='clearBtn'><RemoveCircleOutlineOutlinedIcon /></button>}
        </div>
    )
}

const IngredientList = ({ ingredients, setIngredients }) => {
    useEffect(() => {
        // If the last ingredient is filled, add a new empty ingredient
        if (ingredients[ingredients.length - 1].name !== "") {
            setIngredients([...ingredients, { name: "", amount: "", unit: "" }]);
        }
        // If there are two empty ingredients at the end, remove the last one
        else if (ingredients.length > 1 && ingredients[ingredients.length - 2].name === "") {
            setIngredients(ingredients.slice(0, -1));
        }
    }, [ingredients, setIngredients]);

    const handleIngredientChange = (index, key) => (event) => {
        const newIngredients = [...ingredients];
        newIngredients[index][key] = event.target.value;
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

function RecipeEditor() {
    const { recipeId } = useParams();
    const [ingredients, setIngredients] = useState([{ name: "", amount: "", unit: "" }]);
    const [steps, setSteps] = useState([{ description: "", duration: 0 }]);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [categories, setCategories] = useState("");
    const [images, setImages] = useState([]);
    const [storing, setStoring] = useState(false);
    const [loaded, setLoaded] = useState(false);

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
                setCategories(data.categories.join(", "));
                setIngredients(data.ingredients.map(ingredient => ({ name: ingredient, amount: "", unit: "" })));
                setSteps(data.steps.map(step => ({ description: step, duration: 0 })));
                setLoaded(true);
            })
            .catch((err) => {
                console.log(err.message)
                window.location.href = '/';
            });
    }, [recipeId]);

    const uploadImage = async (file, associatedRecipeId) => {
        const formData = new FormData();
        formData.append('image', file);
        formData.append('recipe_id', associatedRecipeId);

        const response = await fetch(API_BASE + 'image/create', {
            method: 'POST',
            body: formData,
        });

        if (response.ok) {
            const data = await response.json();
            setImages([...images, data.filename]);
        } else {
            console.error('Image upload failed');
        }
    }

    const handleSubmit = async (event) => {
        event.preventDefault();

        setStoring(true);

        const formData = new FormData();
        ingredients.forEach((ingredient, index) => {
            formData.append(`ingredient${index}`, ingredient);
        });

        var data = {
            title: title,
            description: description,
            categories: categories.split(",").map(category => category.trim()),
            ingredients: ingredients.filter(ingredient => ingredient.name !== "").map(ingredient => ingredient.name),
            steps: steps.filter(step => step.description !== "").map(step => step.description),
        }
        if (recipeId !== undefined)
            data.id_ = recipeId;

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

            // Upload images
            if (recipeId !== undefined) {
                images.forEach(image => uploadImage(image, createdRecipeId));
            }

            console.log('Form submitted successfully');
            return redirect("/recipe/" + createdRecipeId);
        } else {
            console.error('Form submission failed');
        }
    };

    const uploadImageOnChange = async (event) => {
        const file = event.target.files[0];
        setImages([file]);
    }

    return (
        <div>
            <Header />
            <div className={"content " + (storing || (recipeId !== undefined && !loaded) ? 'hidden' : '')}>
                <h1>{recipeId === undefined ? "Create a new recipe" : "Edit your recipe"}</h1>
                <form onSubmit={handleSubmit}>
                    {/* TODO: consider using https://mui.com/material-ui/react-text-field/ instead of input */}
                    <label htmlFor="title">Title:</label><br />
                    <input type="text" id="title" name="title" placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} required /><br />
                    <label htmlFor="description">Description:</label><br />
                    <textarea id="description" name="description" placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} required></textarea><br />
                    <label htmlFor="categories">Categories:</label><br />
                    <input type="text" id="categories" name="categories" value={categories} onChange={e => setCategories(e.target.value.replace(/\s+/g, ' '))} required /><br />
                    <label htmlFor="images">Cover Image:</label><br />
                    <input type="file" id="images" name="images" accept="image/*" onChange={uploadImageOnChange} /><br />

                    <h3>Ingredients:</h3>
                    <div>
                        <IngredientList ingredients={ingredients} setIngredients={setIngredients} />
                        <label htmlFor="portions">Portions:</label><br />
                        <input min="1" type="number" id="portions" name="portions" placeholder="Portions" defaultValue={1} required /><br />
                    </div>
                    <h3>Steps:</h3>
                    <div>
                        <StepsList steps={steps} setSteps={setSteps} />
                    </div>
                    <br />
                    <button type="submit">{recipeId === undefined ? "Create" : "Change"}</button><br />
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
        </div>
    )
}

export default RecipeEditor;