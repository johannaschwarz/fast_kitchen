// Recipes.js
import React, { useEffect, useState } from 'react';
import { ThreeDots } from 'react-loader-spinner';
import { Link } from "react-router-dom";
import { API_BASE } from './Config';
import RecipeCard from './RecipeCard';
import './Recipes.css';

import { ArrowDownward, ArrowUpward } from '@mui/icons-material';
import { ToggleButton } from '@mui/material';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';

function Recipes({ filters, search, sortByOption, sortOrder, setSortByOption, setSortOrder }) {
    const [result, setResult] = useState({ key: null, recipes: null });
    const queryKey = JSON.stringify([filters, search, sortByOption, sortOrder]);
    const recipes = result.key === queryKey ? result.recipes : null;

    const handleSortByChange = (e) => {
        setSortByOption(e.target.value);
    };

    const toggleSortOrder = () => {
        setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
    }

    useEffect(() => {
        let ignore = false;
        const params = new URLSearchParams();
        params.append("sort_by", sortByOption);
        params.append("sort_order", sortOrder);
        const filtered = (filters != null && filters.length > 0) || (search != null && search.length > 0);
        if (filters != null && filters.length > 0) {
            filters.forEach((filter) => params.append("categories", filter));
        }
        if (search != null && search.length > 0) {
            params.append("search", search);
        }

        fetch(API_BASE + (filtered ? 'recipe/filtered?' : 'recipe/all?') + params)
            .then((response) => response.json())
            .then((data) => {
                if (!ignore) setResult({ key: queryKey, recipes: data });
            })
            .catch((error) => {
                if (!ignore) console.error('Error fetching recipes:', error);
            });

        return () => { ignore = true; };
    }, [filters, search, sortByOption, sortOrder, queryKey]);

    return (
        <div>
            <Stack
                className='sort-controls'
                direction="row"
                spacing={2}
                sx={{
                    justifyContent: "flex-end",
                    alignItems: "center",
                }}>
                <FormControl size="small">
                    <InputLabel id="sort-label">Sorting</InputLabel>
                    <Select
                        labelId="sort-label"
                        id="sort-select"
                        value={sortByOption}
                        label="Sorting"
                        onChange={handleSortByChange}
                    >
                        <MenuItem value={"Clicks"}>Clicks</MenuItem>
                        <MenuItem value={"RecipeID"}>Date Created</MenuItem>
                        <MenuItem value={"Title"}>Title</MenuItem>
                        <MenuItem value={"CookingTime"}>Cooking Time</MenuItem>
                    </Select>
                </FormControl>
                <ToggleButton value="ASC" onClick={toggleSortOrder} size="small">
                    {sortOrder === 'ASC' ? <ArrowDownward /> : <ArrowUpward />}
                </ToggleButton>

            </Stack>

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
