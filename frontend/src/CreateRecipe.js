import React, { useEffect, useState } from 'react';
import Header from "./Header";

function Ingredient({ ingredient, onChangeIngredient, onChangeAmount, onChangeUnit }) {
    if (ingredient === null) {
        ingredient = { name: "", amount: "", unit: "" };
    }
    return (
        <div className="formRow inlineForm">
            <input type="text" id="ingredient" name="ingredient" placeholder="Ingredient" onChange={onChangeIngredient} defaultValue={ingredient.name} required />
            <input min="0" type="number" id="amount" name="amount" placeholder="Amount" onChange={onChangeAmount} defaultValue={ingredient.amount} required />
            <select id="unit" name="unit" onChange={onChangeUnit} defaultValue={ingredient.unit} required>
                <option value="g">g</option>
                <option value="kg">kg</option>
                <option value="ml">ml</option>
                <option value="l">l</option>
                <option value="pcs">pcs</option>
            </select>
        </div>
    )
}

const IngredientList = () => {
    const [ingredients, setIngredients] = useState([{ name: "", amount: "", unit: "" }]);

    useEffect(() => {
        // If the last ingredient is filled, add a new empty ingredient
        if (ingredients[ingredients.length - 1].name !== "") {
            setIngredients([...ingredients, { name: "", amount: "", unit: "" }]);
        }
        // If there are two empty ingredients at the end, remove the last one
        else if (ingredients.length > 1 && ingredients[ingredients.length - 2].name === "") {
            setIngredients(ingredients.slice(0, -1));
        }
    }, [ingredients]);

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
            <textarea type="text" id="step" name="step" placeholder="Instruction" onChange={onChangeDesciption} defaultValue={step.description} required ></textarea>
        </div>
    )
}

const StepsList = () => {
    const [steps, setSteps] = useState([{ description: "", duration: 0 }]);

    useEffect(() => {
        // If the last step is filled, add a new empty step
        if (steps[steps.length - 1].description !== "") {
            setSteps([...steps, { description: "", duration: 0 }]);
        }
        // If there are two empty steps at the end, remove the last one
        else if (steps.length > 1 && steps[steps.length - 2].description === "") {
            setSteps(steps.slice(0, -1));
        }
    }, [steps]);

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

    return (
        <div>
            <Header />
            <div className="content">
                <h1>Create a new recipe</h1>
                <form>
                    <label htmlFor="title">Title:</label><br />
                    <input type="text" id="title" name="title" placeholder="Title" required /><br />
                    <label htmlFor="description">Description:</label><br />
                    <textarea id="description" name="description" placeholder="Description" required></textarea><br />
                    <label htmlFor="categories">Categories:</label><br />
                    <input type="text" id="categories" name="categories" required /><br />
                    <label htmlFor="images">Cover Image:</label><br />
                    <input type="file" id="images" name="images" accept="image/*" required /><br />

                    <h3>Ingredients:</h3>
                    <div>
                        <IngredientList />
                        <label htmlFor="portions">Portions:</label><br />
                        <input min="1" type="number" id="portions" name="portions" placeholder="Portions" defaultValue={1} required /><br />
                    </div>
                    <h3>Steps:</h3>
                    <div>
                        <StepsList />
                    </div>
                    <br />
                    <button type="submit">Create</button><br />
                </form>
            </div>
        </div>
    )
}

export default CreateRecipe;