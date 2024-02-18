// Recipes.js
import React, { useEffect, useState } from 'react';
import { Link } from "react-router-dom";
import RecipeCard from './RecipeCard';


function Recipes() {
    // const recipes = [
    //     {
    //         "id": 1,
    //         "name": "Flammkuchen",
    //         "category": "Meal",
    //         "categories": ["Meat"],
    //         "creator": "Johanna",
    //         "image": "/flammkuchen.jpeg"
    //     },
    //     {
    //         "id": 12,
    //         "name": "Feechen's Udons",
    //         "category": "Meal",
    //         "categories": ["Meat"],
    //         "creator": "Niklas",
    //         "image": "/udons.jpeg"
    //     }
    // ];
    const [recipes, setRecipies] = useState([]);

    useEffect(() => {
        fetch('http://localhost:8000/recipe/all')
            .then((response) => response.json())
            .then((data) => {
                console.log(data);
                setRecipies(data);
            })
            .catch((err) => {
                console.log(err.message);
            });
    }, []);

    return (
        <section id="recipes">
            {recipes && recipes.map((recipe, index) => (
                <Link key={index} to={'recipe/' + recipe.id_}><RecipeCard recipe={recipe} /></Link>
            ))}
        </section>
    );
}

export default Recipes;