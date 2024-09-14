import RamenDiningOutlinedIcon from '@mui/icons-material/RamenDiningOutlined';
import React from 'react';
import { API_BASE } from './Config';
import './RecipeCard.css';
import { Stack } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

function RecipeCard({ recipe }) {
    return (
        <div className="recipe-card">
            <div className="image-container">
                {recipe.cover_image !== null ? (
                    <img src={API_BASE + "image/" + recipe.cover_image} alt={recipe.name} />
                ) : (
                    <div className="missingImage"><RamenDiningOutlinedIcon /></div>
                )}
                {recipe.cooking_time !== null && (
                    <div className="cooking-time-box">
                        <Stack direction="row" spacing={1} alignItems="center">
                            <AccessTimeIcon fontSize="small" />
                            <p>{recipe.cooking_time} min</p>
                        </Stack>
                    </div>
                )}
            </div>

            <h3>{recipe.title}</h3>
            <span className="creator">by {recipe.creator ? recipe.creator : "an unknown cook"}</span>
            <p className="rating">{recipe.rating}</p>
            {recipe.categories.map((label, index) => (
                <span key={index} className="label">{label}</span>
            ))}
        </div>
    );
}

export default RecipeCard;
