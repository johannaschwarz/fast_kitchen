import React, { useState } from 'react';
import Header from "./Header";

function Ingredient(props) {
    return (
        <div className="inline-form">
            <input type="text" id="ingredient" name="ingredient" placeholder="Ingredient" required />
            <input type="text" id="amount" name="amount" placeholder="Amount" required />
            <select id="unit" name="unit" required>
                <option value="g">g</option>
                <option value="kg">kg</option>
                <option value="ml">ml</option>
                <option value="l">l</option>
                <option value="pcs">pcs</option>
            </select>
        </div>
    )
}

function Step() {
    return (
        <div>
            <input type="text" id="step" name="step" placeholder="Instruction" required />
        </div>
    )
}

function CreateRecipe() {
    const [ingredients, setIngredients] = useState([]);

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
                        {ingredients.map((ingredient, index) => <Ingredient key={index} />)}
                        <Ingredient />
                    </div>
                    <h3>Steps:</h3>
                    <div>
                        <Step />
                    </div>
                    <br />
                    <button type="submit">Create</button><br />
                </form>
            </div>
        </div>
    )
}

export default CreateRecipe;