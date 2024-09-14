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

function Recipes({ filters, search }) {
    const [recipes, setRecipies] = useState(null)
    const [sortByOption, setSortByOption] = useState('Clicks');
    const [sortOrder, setSortOrder] = useState('DESC');

    const fetchSortedRecipes = async (sortByOption, sortOrder) => {
        setRecipies(null);
        try {
            let params = new URLSearchParams()
            params.append("sort_by", sortByOption)
            params.append("sort_order", sortOrder)

            const response = await fetch(API_BASE + 'recipe/all?' + new URLSearchParams(params));
            const data = await response.json();
            setRecipies(data);
        } catch (error) {
            console.error('Error fetching sorted recipes:', error);
        }
    }

    const handleSortByChange = (e) => {
        setSortByOption(e.target.value);
    };

    const toggleSortOrder = () => {
        setSortOrder((prevOrder) => prevOrder === 'ASC' ? 'DESC' : 'ASC');
    }

    useEffect(() => {
        if ((filters != null && filters.length > 0) || (search != null && search.length > 0)) {
            setRecipies(null)
            let params = new URLSearchParams()
            params.append("sort_by", sortByOption)
            params.append("sort_order", sortOrder)

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
            fetchSortedRecipes(sortByOption, sortOrder);
        }
    }, [filters, search, sortByOption, sortOrder]);

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
                <ToggleButton onClick={toggleSortOrder} size="small">
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