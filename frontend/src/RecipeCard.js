// RecipeCard.js
import React from 'react';

function RecipeCard({ recipe }) {
    return (
        <div className="recipe-card">
            <img src={recipe.image} alt={recipe.name} />
            <h3>{recipe.name}</h3>
            <span className="creator">by {recipe.creator}</span>
            <p className="rating">{recipe.rating}</p>
            {recipe.labels.map((label, index) => (
                <span key={index} className="label">{label}</span>
            ))}
        </div>
    );
}

export default RecipeCard;