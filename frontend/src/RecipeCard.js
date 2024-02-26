// RecipeCard.js
import React from 'react';
import { API_BASE } from './Config';
import './RecipeCard.css';

function RecipeCard({ recipe }) {
    return (
        <div className="recipe-card">
            {recipe.images.length > 0 &&
                <img src={API_BASE + "image/" + recipe.images[0]} alt={recipe.name} />
            }
            <h3>{recipe.title}</h3>
            <span className="creator">by {recipe.creator}</span>
            <p className="rating">{recipe.rating}</p>
            {recipe.categories.map((label, index) => (
                <span key={index} className="label">{label}</span>
            ))}
        </div>
    );
}

export default RecipeCard;