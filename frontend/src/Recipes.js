// Recipes.js
import React, { useEffect, useState } from 'react';
import { ThreeDots } from 'react-loader-spinner';
import { Link } from "react-router-dom";
import { API_BASE } from './Config';
import RecipeCard from './RecipeCard';

import './Recipes.css';

function Recipes({ filters, search }) {
    const [recipes, setRecipies] = useState(null)

    useEffect(() => {
        if ((filters != null && filters.length > 0) || (search != null && search.length > 0)) {
            setRecipies(null)
            let params = new URLSearchParams()

            if (filters != null && filters.length > 0) {
                filters.map((filter) => params.append("categories", filter))
            }
            if (search != null && search.length > 0) {
                params.append("search", search)
            }

            fetch(API_BASE + 'recipe/filtered?' + new URLSearchParams(params))
                .then((response) => response.json())
                .then((data) => {
                    setRecipies(data)
                })
                .catch((err) => {
                    console.log(err.message)
                });
        } else {
            setRecipies(null);
            fetch(API_BASE + 'recipe/all')
                .then((response) => response.json())
                .then((data) => {
                    setRecipies(data)
                })
                .catch((err) => {
                    console.log(err.message)
                });
        }
    }, [filters, search]);

    return (
        <div>
            <section id="recipes">
                {recipes != null && recipes.length > 0 && recipes.map((recipe, index) => (
                    <Link key={index} to={'recipe/' + recipe.id_}><RecipeCard recipe={recipe} /></Link>
                ))}
            </section>

            {recipes != null && recipes.length === 0 && <div>
                <p>There are no recipes{filters != null || search != null ? " with those properties" : ""} yet, <Link className='link' to="/create">create the first one</Link>!</p>
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
                    wrapperClass="" />
            </div>
        </div>
    );
}

export default Recipes;