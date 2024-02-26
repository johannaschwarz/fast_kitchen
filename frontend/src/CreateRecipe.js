import React, { useEffect, useState } from 'react';
import { ThreeDots } from 'react-loader-spinner';
import { API_BASE } from './Config';
import Header from "./Header";

function Ingredient({ ingredient, onChangeIngredient, onChangeAmount, onChangeUnit }) {
    if (ingredient === null) {
        ingredient = { name: "", amount: "", unit: "" };
    }
    return (
        <div className="formRow inlineForm">
            <input type="text" id="ingredient" name="ingredient" placeholder="Ingredient" onChange={onChangeIngredient} defaultValue={ingredient.name} />
            <input min="0" type="number" id="amount" name="amount" placeholder="Amount" onChange={onChangeAmount} defaultValue={ingredient.amount} />
            <select id="unit" name="unit" onChange={onChangeUnit} defaultValue={ingredient.unit}>
                <option value="g">g</option>
                <option value="kg">kg</option>
                <option value="ml">ml</option>
                <option value="l">l</option>
                <option value="pcs">pcs</option>
            </select>
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

    return (
        <div>
            {ingredients.map((ingredient, index) => (
                <Ingredient
                    key={index}
                    ingredient={ingredient}
                    onChangeIngredient={handleIngredientChange(index, "name")}
                    onChangeAmount={handleIngredientChange(index, "amount")}
                    onChangeUnit={handleIngredientChange(index, "unit")}
                />
            ))}
        </div>
    );
};

function Step({ index, step, onChangeDesciption, onChangeDuration }) {
    return (
        <div className='formRow inlineForm'>
            <span>{index}.</span>
            <textarea type="text" id="step" name="step" placeholder="Instruction" onChange={onChangeDesciption} defaultValue={step.description}></textarea>
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

    return (
        <div>
            {steps.map((step, index) => (
                <Step
                    key={index}
                    index={index + 1}
                    step={step}
                    onChangeDesciption={handleStepChange(index, "description")}
                    onChangeDuration={handleStepChange(index, "duration")}
                />
            ))}
        </div>
    );
};

function CreateRecipe() {
    const [ingredients, setIngredients] = useState([{ name: "", amount: "", unit: "" }]);
    const [steps, setSteps] = useState([{ description: "", duration: 0 }]);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [categories, setCategories] = useState("");
    const [images, setImages] = useState([]);
    const [storing, setStoring] = useState(false);

    const uploadImage = async (file, recipeId) => {
        const formData = new FormData();
        formData.append('image', file);
        formData.append('recipe_id', recipeId);

        const response = await fetch(API_BASE + 'image/upload', {
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

        const data = {
            title: title,
            description: description,
            categories: categories.split(",").map(category => category.trim()),
            ingredients: ingredients.filter(ingredient => ingredient.name !== "").map(ingredient => ingredient.name),
            steps: steps.filter(step => step.description !== "").map(step => step.description),
            images: [],
        }

        // Post form data
        const response = await fetch(API_BASE + 'recipe/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        setStoring(false);

        if (response.ok) {
            const responseData = await response.json();
            const recipeId = responseData.id_;

            // Upload images
            images.forEach(image => uploadImage(image, recipeId));

            console.log('Form submitted successfully');
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
            <div className={"content " + (storing ? 'hidden' : '')}>
                <h1>Create a new recipe</h1>
                <form onSubmit={handleSubmit}>
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
                    <button type="submit">Create</button><br />
                </form>
            </div>

            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
            }}>
                <ThreeDots
                    visible={storing}
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
    )
}

export default CreateRecipe;