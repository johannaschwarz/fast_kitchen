// Recipes.js
import React, { useEffect, useState } from 'react';
import { ThreeDots } from 'react-loader-spinner';
import { Link } from "react-router-dom";
import RecipeCard from './RecipeCard';

import './Recipes.css';

function Recipes() {
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
        <div>
            <section id="recipes">
                {recipes && recipes.map((recipe, index) => (
                    <Link key={index} to={'recipe/' + recipe.id_}><RecipeCard recipe={recipe} /></Link>
                ))}
            </section>

            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
            }}>
                <ThreeDots
                    visible={recipes.length === 0}
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
    );
}

export default Recipes;