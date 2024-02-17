// Recipes.js
import React from 'react';
import { Link } from "react-router-dom";
import RecipeCard from './RecipeCard';

function Recipes() {
    const recipes = [
        {
            "id": 1,
            "name": "Flammkuchen",
            "category": "Meal",
            "labels": ["Meat"],
            "creator": "Johanna",
            "image": "/flammkuchen.jpeg"
        },
        {
            "id": 12,
            "name": "Feechen's Udons",
            "category": "Meal",
            "labels": ["Meat"],
            "creator": "Niklas",
            "image": "/udons.jpeg"
        }
    ];

    return (
        <section id="recipes">
            {recipes.map((recipe, index) => (
                <Link key={index} to={'recipe/' + recipe.id}><RecipeCard recipe={recipe} /></Link>
            ))}
        </section>
    );
}

export default Recipes;