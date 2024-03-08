// Recipes.js
import React, { useEffect, useState } from 'react';
import { ThreeDots } from 'react-loader-spinner';
import { Link } from "react-router-dom";
import { API_BASE } from './Config';
import RecipeCard from './RecipeCard';

import './Recipes.css';

function Recipes() {
    const [recipes, setRecipies] = useState(null);

    useEffect(() => {
        fetch(API_BASE + 'recipe/all')
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
                {recipes != null && recipes.length > 0 && recipes.map((recipe, index) => (
                    <Link key={index} to={'recipe/' + recipe.id_}><RecipeCard recipe={recipe} /></Link>
                ))}
            </section>

            {recipes != null && recipes.length === 0 && <div>
                <p>There are no recipes yet, <Link className='link' to="/create">create the first one</Link>!</p>
            </div>}

            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
            }}>
                <ThreeDots
                    visible={recipes == null}
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
    );
}

export default Recipes;