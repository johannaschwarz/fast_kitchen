// Header.js
import SearchIcon from '@mui/icons-material/Search';
import { Autocomplete, TextField } from '@mui/material';
import InputAdornment from '@mui/material/InputAdornment';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE } from './Config';

function Header({ setSearchInput }) {
    const [search, setSearch] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (setSearchInput !== undefined) {
            return
        }

        setResults([])
        let params = new URLSearchParams()

        if (search != null && search.length > 0) {
            params.append("search", search)
        } else {
            return
        }

        // Limit the number of results to 10
        params.append("limit", 10)

        setLoading(true)
        fetch(API_BASE + 'recipe/filtered?' + new URLSearchParams(params))
            .then((response) => response.json())
            .then((data) => {
                setResults(data)
                setLoading(false)
            })
            .catch((err) => {
                console.log(err.message)
                setLoading(false)
            });

    }, [search]);

    return (
        <header>
            <div id="logo">
                <Link to="/"><img src="/logo_text.png" alt="Fast Kitchen" /></Link>
            </div>
            {setSearchInput === undefined && <Autocomplete
                className='search-bar'
                options={results}
                getOptionLabel={(option) =>
                    typeof option === 'string' ? option : option.title
                }
                onInputChange={(_e, val) => setSearch(val)}
                renderOption={(props, option) => {
                    return (
                        <Link  {...props} className='search-result' to={`/recipe/${option.id_}`}>{option.title}</Link>
                    );
                }}
                loading={loading}
                noOptionsText="No matching recipes found."
                popupIcon={null}
                renderInput={(params) => <TextField {...params} placeholder="Search for recipes" InputProps={{
                    ...params.InputProps,
                    startAdornment: (<InputAdornment position="start"> <SearchIcon />
                    </InputAdornment>)
                }} />} />
            }
            {setSearchInput !== undefined && <TextField
                className='search-bar'
                placeholder="Search for recipes"
                InputProps={{
                    startAdornment: (<InputAdornment position="start"> <SearchIcon />
                    </InputAdornment>)
                }}
                onChange={(e) => {
                    setSearchInput(e.target.value)
                }} />}
            <Link id="create-recipe" to="/create"><button>New Recipe</button></Link>
        </header >
    );
}

export default Header;