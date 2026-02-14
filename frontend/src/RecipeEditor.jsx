import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import LinkIcon from '@mui/icons-material/Link';
import RemoveCircleOutlineOutlinedIcon from '@mui/icons-material/RemoveCircleOutlineOutlined';
import { Alert, AlertTitle, Autocomplete, Box, Button, Divider, MenuItem, Stack, TextField } from '@mui/material';
import { styled } from '@mui/material/styles';
import React, { useContext, useEffect, useState } from 'react';

import { Navigate, useNavigate, useParams } from "react-router-dom";
import { API_BASE } from './Config';
import Footer from './Footer';
import Header from "./Header";
import { AuthContext } from './index.jsx';

import './RecipeEditor.css';


const uploadImage = async (file, token) => {
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch(API_BASE + 'image/create', {
        method: 'POST',
        headers: {
            "Authorization": "Bearer " + token,
        },
        body: formData,
    });

    if (response.ok) {
        const data = await response.json();
        return data.id_;
    } else {
        console.error('Image upload failed');
        return -1;
    }
}

const deleteImage = async (id, token) => {
    const response = await fetch(API_BASE + 'image/' + id, {
        method: 'DELETE',
        headers: {
            "Authorization": "Bearer " + token,
        }
    });

    if (response.ok) {
        console.log('Image with id ' + id + ' deleted');
    } else {
        console.error('Delete image with id ' + id + ' failed');
    }
}

const imagesList = (images, imgClass, deleteStepImageOnChange, iconClass = "deleteIcon") => {
    return (
        <Stack direction={'row'} spacing={2} className='imageList'>
            {images.map((image) => (
                <div key={image}>
                    <div className='uploadImgContainer'>
                        <img className={imgClass} src={API_BASE + "image/" + image} alt={image} />
                        <button type="button" onClick={() => deleteStepImageOnChange(image)} className={iconClass}>
                            <RemoveCircleOutlineOutlinedIcon />
                        </button>
                    </div>
                </div>
            ))}
        </Stack>
    );
}

const UploadButton = styled(Button)({
    backgroundColor: 'var(--primary-color)',
    '&:hover': {
        backgroundColor: 'var(--secondary-color)',
    },
    fontWeight: "bold",
    borderRadius: 20,
})

const VisuallyHiddenInput = styled('input')({
    clip: 'rect(0 0 0 0)',
    clipPath: 'inset(50%)',
    height: 1,
    overflow: 'hidden',
    position: 'absolute',
    bottom: 0,
    left: 0,
    whiteSpace: 'nowrap',
    width: 1,
});

const measureUnits = ["g", "kg", "ml", "l", "pcs", "tbsp", "tsp"];

const inputProps = {
    inputProps: {
        style: {
            color: 'var(--text-color)'
        }
    },
};

const textFieldSx = {
    '& .MuiOutlinedInput-root': {
        '& fieldset': {
            borderColor: 'var(--input-border)',
        },
        '&:hover fieldset': {
            borderColor: 'var(--input-border)',
        },
        '&.Mui-focused fieldset': {
            borderColor: 'var(--primary-color)',
        },
        backgroundColor: 'var(--input-bg)',
    },
    '& .MuiInputLabel-root': {
        color: 'var(--text-color)',
    },
    '& .MuiInputLabel-root.Mui-focused': {
        color: 'var(--primary-color)',
    },
    '& .MuiSelect-icon': {
        color: 'var(--text-color)',
    },
};

function Ingredient({ ingredient, onChangeIngredient, onChangeAmount, onChangeUnit, onDelete }) {
    if (ingredient === null) {
        ingredient = { name: "", amount: 0, unit: "g", group: "" };
    }
    return (
        <Stack direction="row" spacing={2}>
            <TextField slotProps={inputProps} sx={textFieldSx} type="text" id="ingredient" name="ingredient" label="Ingredient" onChange={onChangeIngredient} value={ingredient.name} />
            <TextField slotProps={inputProps} sx={textFieldSx} min="0" type="number" id="amount" name="amount" label="Amount" onWheel={(e) => e.target.blur()} onChange={onChangeAmount} value={ingredient.amount} />
            <TextField slotProps={inputProps} sx={textFieldSx} select label="Select" id="unit" name="unit" defaultValue={"g"} onChange={onChangeUnit} value={ingredient.unit} >
                {measureUnits.map((option) => (
                    <MenuItem key={option} value={option} sx={{ color: 'var(--text-color)', '&:hover': { backgroundColor: 'var(--input-border)' } }}>
                        {option}
                    </MenuItem>
                ))}
            </TextField>
            {ingredient.name !== "" && < button type='button' onClick={onDelete} className='clearBtn'><RemoveCircleOutlineOutlinedIcon /></button>}
        </Stack>
    )
}

const IngredientList = ({ ingredients, setIngredients }) => {
    useEffect(() => {
        // If the last ingredient is filled, add a new empty ingredient
        let newIngredients = [...ingredients];
        let change = false;
        newIngredients.forEach((group, groupIndex) => {
            if (group.ingredients.length === 0 || group.ingredients[group.ingredients.length - 1].name !== "") {
                group.ingredients.push({ name: "", amount: 0, unit: "g", group: "" });
                change = true;
            }
            // If there are two empty ingredients at the end, remove the last one
            else if (group.ingredients.length > 1 && group.ingredients[group.ingredients.length - 2].name === "") {
                group.ingredients = group.ingredients.slice(0, -1);
                change = true;
            }
        });
        if (change)
            setIngredients(newIngredients);
    }, [ingredients, setIngredients]);

    const handleIngredientChange = (groupIndex, index, key) => (event) => {
        const newGroupIngredients = [...ingredients[groupIndex]["ingredients"]];
        if (key === "amount") {
            newGroupIngredients[index][key] = event.target.value !== "" ? parseFloat(event.target.value) : "";
        } else {
            newGroupIngredients[index][key] = event.target.value;
        }

        const newIngredients = [...ingredients];
        newIngredients[groupIndex]["ingredients"] = newGroupIngredients;
        setIngredients(newIngredients);
    };

    const handleDeleteIngredient = (groupIndex, index) => (_event) => {
        const newGroupIngredients = [...ingredients[groupIndex]["ingredients"]];
        newGroupIngredients.splice(index, 1);

        const newIngredients = [...ingredients];
        newIngredients[groupIndex]["ingredients"] = newGroupIngredients;
        setIngredients(newIngredients);
    }

    const handleGroupNameChange = (groupIndex) => (event) => {
        const newIngredients = [...ingredients];
        newIngredients[groupIndex]["group"] = event.target.value;
        setIngredients(newIngredients);
    }

    const addIngredientGroup = () => {
        setIngredients([...ingredients, { group: "", ingredients: [{ name: "", amount: 0, unit: "g", group: "" }] }]);
    };

    const deleteIngredientGroup = (groupIndex) => (_event) => {
        const newIngredients = [...ingredients];
        newIngredients.splice(groupIndex, 1);
        setIngredients(newIngredients);
    };
    return (
        <Stack>
            {ingredients.map((ingredientGroup, groupIndex) => (
                <Stack spacing={2} key={groupIndex}>
                    {ingredients.length > 1 && <Stack direction="row" spacing={2}>
                        <TextField id={"group_name_" + groupIndex} name="group" label="Ingredient Group" onChange={handleGroupNameChange(groupIndex)} value={ingredientGroup["group"]} /><br />
                        {ingredients.length > 1 && < button type='button' onClick={deleteIngredientGroup(groupIndex)} className='clearBtn'><RemoveCircleOutlineOutlinedIcon /></button>}
                    </Stack>}
                    {ingredientGroup["ingredients"].map((ingredient, index) => (
                        <Ingredient
                            key={index}
                            ingredient={ingredient}
                            group={ingredientGroup}
                            onChangeIngredient={handleIngredientChange(groupIndex, index, "name")}
                            onChangeAmount={handleIngredientChange(groupIndex, index, "amount")}
                            onChangeUnit={handleIngredientChange(groupIndex, index, "unit")}
                            onDelete={handleDeleteIngredient(groupIndex, index)}
                        />
                    ))}
                    <Divider />
                    <br />
                </Stack>))}
            <br />
            <button type="button" onClick={addIngredientGroup}>Add ingredient group</button>
        </Stack>
    );
};

function Step({ index, step, onChangeDesciption, onDelete, onUploadImage, onDeleteImage }) {
    return (
        <div>
            <Stack direction={'row'} spacing={2} style={{ marginBottom: 10 }}>
                <span>{index}.</span>
                <Stack direction={'column'} spacing={1} style={{ width: '100%' }}>
                    <Stack direction={'row'} spacing={2} alignItems="center" style={{ marginBottom: 10 }}>
                        <TextField
                            multiline
                            minRows={1}
                            maxRows={10}
                            type="text"
                            id="step"
                            name="step"
                            label="Instruction"
                            onChange={onChangeDesciption}
                            value={step.description}
                            sx={{
                                ...textFieldSx,
                                width: '100%',
                                '& .MuiInputBase-root': {
                                    alignItems: 'flex-start'
                                }
                            }}
                        />
                        <Stack direction="row" spacing={1} alignItems="center" style={{ flexShrink: 0 }}>
                            <UploadButton component="label" variant="contained" htmlFor={"step_image" + index} startIcon={<CloudUploadIcon />}>
                                Image
                                <VisuallyHiddenInput type="file" id={"step_image" + index} name="step_image" accept="image/*" onChange={onUploadImage} />
                            </UploadButton>
                            {step.description !== "" && <button type='button' onClick={onDelete} className='clearBtn'><RemoveCircleOutlineOutlinedIcon /></button>}
                        </Stack>
                    </Stack>
                    {step.images.length > 0 && imagesList(step.images, "stepImg", onDeleteImage, "deleteIconStep")}
                </Stack>
            </Stack>
        </div>
    )
}

const StepsList = ({ steps, setSteps }) => {
    const { token } = useContext(AuthContext);

    useEffect(() => {
        // If the last step is filled, add a new empty step
        if (steps.length > 0 && steps[steps.length - 1].description !== "") {
            setSteps([...steps, { description: "", images: [] }]);
        }
        // If there are two empty steps at the end, remove the last one
        else if (steps.length > 1 && steps[steps.length - 2].description === "") {
            setSteps(steps.slice(0, -1));
        }
    }, [steps, setSteps]);

    const handleStepChange = (index, key) => (event) => {
        const newSteps = [...steps];
        newSteps[index][key] = event.target.value;
        setSteps(newSteps);
    };

    const handleDeleteStep = (index) => (_event) => {
        const newSteps = [...steps];
        newSteps.splice(index, 1);
        setSteps(newSteps);
    }

    const uploadStepImageOnChange = (index) => (event) => {
        const newSteps = [...steps];
        const file = event.target.files[0];
        uploadImage(file, token).then(id_ => {
            let step = newSteps[index];
            step.images.push(id_);
            newSteps[index] = step;
            setSteps(newSteps);
            event.target.value = null;
        });
    }

    const deleteStepImageOnChange = (index) => async (id) => {
        const newSteps = [...steps];
        deleteImage(id, token).then(() => {
            let step = newSteps[index];
            const newImages = step.images.filter(image => image !== id);
            step.images = newImages;
            newSteps[index] = step;
            setSteps(newSteps);
        });
    }

    return (
        <Stack spacing={2} style={{ marginBottom: 30 }}>
            {steps.map((step, index) => (
                <Step
                    key={index}
                    index={index + 1}
                    step={step}
                    onChangeDesciption={handleStepChange(index, "description")}
                    onDelete={handleDeleteStep(index)}
                    onDeleteImage={deleteStepImageOnChange(index)}
                    onUploadImage={uploadStepImageOnChange(index)}
                />
            ))}
        </Stack>
    );
};

const defaultFilters = ['Vegan', 'Vegetarian', 'Quick & Easy'];
function RecipeEditor() {
    const { loggedIn, token } = useContext(AuthContext);
    const navigate = useNavigate();
    const { recipeId } = useParams();
    const [ingredients, setIngredients] = useState([{ group: "", ingredients: [{ name: "", amount: 0, unit: "g", group: "" }] }]);
    const [steps, setSteps] = useState([{ order_id: 0, description: "", images: [] }]);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [cookingTime, setCookingTime] = useState(20);
    const [portions, setPortions] = useState(1);
    const [categories, setCategories] = useState([]);
    const [coverImage, setCoverImage] = useState("");
    const [galleryImages, setGalleryImages] = useState([]);
    const [storing, setStoring] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const [alertMessage, setAlertMessage] = useState("");
    const [alertSeverity, setAlertSeverity] = useState("error");
    const [filters, setFilters] = useState(defaultFilters);
    const [importUrl, setImportUrl] = useState("");
    const [importText, setImportText] = useState("");
    const [importing, setImporting] = useState(false);
    const [inputMode, setInputMode] = useState(0); // 0 = manual, 1 = from text

    useEffect(() => {
        fetch(API_BASE + 'category/all')
            .then((response) => response.json())
            .then((all_categories) => {
                let newFilters = [...new Set([...defaultFilters, ...all_categories])];
                setFilters(newFilters);
            })
            .catch((err) => {
                console.log(err.message);
            });
    }, []);

    useEffect(() => {
        if (recipeId === undefined) {
            return;
        }
        fetch(API_BASE + 'recipe/specific/' + recipeId)
            .then((response) => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json()
            })
            .then((data) => {
                setTitle(data.title);
                setDescription(data.description);
                setCategories(data.categories);
                setPortions(data.portions);
                setCookingTime(data.cooking_time);
                if (data.ingredients.length > 0) {
                    let newIngredients = []
                    for (let i = 0; i < data.ingredients.length; i++) {
                        let groupIndex = newIngredients.findIndex(group => group.group === data.ingredients[i].group);
                        if (groupIndex === -1) {
                            newIngredients.push({ group: data.ingredients[i].group, ingredients: [] });
                            groupIndex = newIngredients.length - 1;
                        }
                        newIngredients[groupIndex].ingredients.push({
                            name: data.ingredients[i].name,
                            amount: data.ingredients[i].amount,
                            unit: data.ingredients[i].unit,
                        });
                    }
                    console.log(newIngredients);
                    setIngredients(newIngredients);
                }
                if (data.steps.length > 0)
                    setSteps(data.steps.map(step => ({ order_id: step.order_id, description: step.step, images: step.images })));
                setGalleryImages(data.gallery_images);
                setCoverImage(data.cover_image);
                setLoaded(true);
            })
            .catch((err) => {
                console.log(err.message)
                window.location.href = '/';
            });
    }, [recipeId]);

    if (!loggedIn) {
        return <Navigate to={"/login"} />;
    }

    const recipeChecks = () => {
        if (title.trim() === "") {
            setAlertMessage("Please enter a title");
            return false;
        }

        if (description.trim() === "") {
            setAlertMessage("Please enter a description");
            return false;
        }

        if (categories.length === 0) {
            setAlertMessage("Please enter at least one category");
            return false;
        }

        if (cookingTime <= 0) {
            setAlertMessage("Please enter a valid cooking time");
            return false;
        }

        // check for distinct ingredient groups
        let groupNames = ingredients.map(group => group.group);
        if (groupNames.length !== new Set(groupNames).size) {
            setAlertMessage("Ingredient groups must have different names");
            return false;
        }

        // check if all groups have a name if there is more than one
        if (ingredients.length > 1 && ingredients.filter(group => group.group === "").length > 0) {
            setAlertMessage("Ingredient groups must have a name");
            return false;
        }

        if (steps.filter(step => step.description.trim() !== "").length === 0) {
            setAlertMessage("Please enter at least one step");
            return false;
        }
        return true;
    }

    const handleSubmit = async (event) => {
        event.preventDefault();

        setAlertMessage("");

        let flattenedIngredients = ingredients.map(group => group.ingredients.map(ingredient => (
            { name: ingredient.name.trim(), amount: parseFloat(ingredient.amount), unit: ingredient.unit, group: group.group }
        )).filter(ingredient => ingredient.name !== "")).flat();

        if (!recipeChecks()) {
            return;
        }

        setStoring(true);
        var data = {
            title: title,
            description: description,
            categories: categories.map(category => category.trim()),
            portions: portions,
            cooking_time: parseInt(cookingTime),
            ingredients: flattenedIngredients,
            steps: steps.filter(step => step.description.trim() !== "").map((step, index) => ({ order_id: index, step: step.description.trim(), images: step.images })),
            cover_image: coverImage !== "" ? Number(coverImage) : -1,
            gallery_images: galleryImages.map(image => Number(image)),
        }
        if (recipeId !== undefined)
            data.id_ = recipeId;

        if (galleryImages.length > 0)
            data.gallery_images = galleryImages;

        console.log(data)

        // Post form data
        const response = await fetch(API_BASE + (recipeId === undefined ? 'recipe/create' : 'recipe/' + recipeId), {
            method: recipeId === undefined ? 'POST' : 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token,
            },
            body: JSON.stringify(data),
        });

        if (response.ok) {
            const responseData = await response.json();
            const createdRecipeId = responseData.id_;

            console.log('Form submitted successfully');

            window.location.href = '/recipe/' + createdRecipeId;
        } else {
            setStoring(false);
            response.text().then(text => {
                console.log("Form submission failed")
                console.log(text);
                setAlertMessage("An error occured: " + text);
            });
        }
    };

    const handleImport = async () => {
        if (!importUrl) {
            setAlertMessage("Please enter a URL to import");
            setAlertSeverity("error");
            return;
        }

        setImporting(true);
        setAlertMessage("");

        try {
            const response = await fetch(API_BASE + 'parse-external-recipe?' + new URLSearchParams({
                url: importUrl
            }), {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + token,
                },
            });

            if (response.ok) {
                const data = await response.json();
                navigate('/edit/' + data.id_);
            } else {
                const error = await response.json();
                setAlertMessage('Import failed: ' + error.detail);
                setAlertSeverity("error");
            }
        } catch (err) {
            console.error(err);
            setAlertMessage('Import failed, please try again later.');
            setAlertSeverity("error");
        }

        setImporting(false);
    };

    const handleTextImport = async () => {
        if (!importText.trim()) {
            setAlertMessage("Please enter recipe text to parse");
            setAlertSeverity("error");
            return;
        }

        setImporting(true);
        setAlertMessage("");

        try {
            const response = await fetch(API_BASE + 'parse-recipe-text?' + new URLSearchParams({
                text: importText
            }), {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + token,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setInputMode(0);
                navigate('/edit/' + data.id_);
            } else {
                const error = await response.json();
                setAlertMessage('Parsing failed: ' + error.detail);
                setAlertSeverity("error");
            }
        } catch (err) {
            console.error(err);
            setAlertMessage('Parsing failed, please try again later.');
            setAlertSeverity("error");
        }

        setImporting(false);
    };

    const uploadGalleryImageOnChange = async (event) => {
        const file = event.target.files[0];
        uploadImage(file, token).then(id_ => { if (id_ !== -1) setGalleryImages([...galleryImages, id_]); event.target.value = null });
    }

    const deleteGalleryImageOnChange = async (id) => {
        deleteImage(id, token).then(() => setGalleryImages(galleryImages.filter(image => image !== id)));
    }

    const uploadCoverImageOnChange = async (event) => {
        const file = event.target.files[0];
        uploadImage(file, token).then(id_ => { setCoverImage(id_); console.log("set cover image to" + id_); event.target.value = null });
    }

    const deleteCoverImageOnChange = async (id) => {
        deleteImage(id, token).then(() => setCoverImage(""));
    }

    return (
        <div className="main">
            <Header />
            <div className={"content " + ((storing || importing || (recipeId !== undefined && !loaded)) ? 'hidden' : '')}>
                <h1>{recipeId === undefined ? "Create a new recipe" : "Edit your recipe"}</h1>
                <form onSubmit={handleSubmit}>
                    <Stack>
                        {recipeId === undefined && (
                            <Stack direction="row" spacing={2} sx={{ marginBottom: 2 }}>
                                <TextField
                                    slotProps={inputProps}
                                    sx={{ ...textFieldSx, flexGrow: 1 }}
                                    placeholder="Enter URL to import recipe"
                                    value={importUrl}
                                    onChange={(e) => setImportUrl(e.target.value)}
                                    disabled={importing}
                                />
                                <Button
                                    type="button"
                                    variant="contained"
                                    startIcon={<LinkIcon />}
                                    onClick={handleImport}
                                    disabled={importing || !importUrl}
                                    sx={{
                                        backgroundColor: 'var(--primary-color)',
                                        '&:hover': {
                                            backgroundColor: 'var(--secondary-color)',
                                        },
                                        fontWeight: "bold",
                                        borderRadius: 20,
                                    }}
                                >
                                    Import
                                </Button>
                            </Stack>
                        )}

                        {alertMessage && <Alert severity={alertSeverity} style={{ marginBottom: 20 }}>
                            <AlertTitle>{alertSeverity === "error" ? "Error" : "Info"}</AlertTitle>
                            {alertMessage}
                        </Alert>}

                        <TextField slotProps={inputProps} sx={textFieldSx} id="title" name="title" label="Title" value={title} onChange={e => setTitle(e.target.value)} required /><br />
                        <TextField slotProps={inputProps} sx={textFieldSx} id="description" name="description" label="Description" value={description} onChange={e => setDescription(e.target.value)} required /><br />
                        <TextField slotProps={inputProps} sx={textFieldSx} id="cookingTime" name="cookingTime" label="Cooking time in minutes" type="number" value={cookingTime} onWheel={(e) => e.target.blur()} onChange={e => setCookingTime(e.target.value)} required /><br />
                        <Autocomplete
                            disablePortal
                            options={filters}
                            sx={{ width: 300 }}
                            freeSolo
                            multiple
                            value={categories}
                            onChange={(_, value) => { setCategories(value) }}
                            renderInput={(params) => <TextField {...params} slotProps={{ ...params.InputProps, ...inputProps }} sx={textFieldSx} label="Categories" />}
                        /><br />
                        <Divider sx={{ borderColor: 'var(--input-border)' }} />

                        <h3>Images:</h3>
                        <UploadButton component="label" variant="contained" htmlFor="cover_image" startIcon={<CloudUploadIcon />}>
                            Cover Image
                            <VisuallyHiddenInput type="file" id="cover_image" name="cover_image" accept="image/*" onChange={uploadCoverImageOnChange} />
                        </UploadButton><br />
                        {coverImage &&
                            <div className="uploadImgContainer">
                                <img className='coverImg' src={API_BASE + "image/" + coverImage} alt={"Recipe Cover"} />
                                <button type='button' onClick={() => deleteCoverImageOnChange(coverImage)} className='deleteIcon'><RemoveCircleOutlineOutlinedIcon /></button>
                            </div>
                        }
                        <br />

                        <UploadButton component="label" variant="contained" htmlFor="gallery_images" startIcon={<CloudUploadIcon />}>
                            Gallery Images
                            <VisuallyHiddenInput type="file" id="gallery_images" name="gallery_images" accept="image/*" onChange={uploadGalleryImageOnChange} />
                        </UploadButton><br />
                        {galleryImages.length > 0 && imagesList(galleryImages, "galleryImg", deleteGalleryImageOnChange)}<br />

                        <Divider sx={{ borderColor: 'var(--input-border)' }} />

                        {recipeId === undefined && (
                            <Stack direction="row" spacing={0} sx={{ mt: 2, mb: 0 }}>
                                {['Manual', 'From Text'].map((label, i) => (
                                    <Box
                                        key={label}
                                        onClick={() => setInputMode(i)}
                                        sx={{
                                            px: 2,
                                            py: 1,
                                            cursor: 'pointer',
                                            fontSize: '0.9rem',
                                            fontWeight: inputMode === i ? 'bold' : 'normal',
                                            color: inputMode === i ? 'var(--primary-color)' : 'var(--text-color)',
                                            borderBottom: inputMode === i ? '2px solid var(--primary-color)' : '2px solid transparent',
                                            opacity: inputMode === i ? 1 : 0.6,
                                            transition: 'all 0.15s ease',
                                            '&:hover': { opacity: 1 },
                                            userSelect: 'none',
                                        }}
                                    >
                                        {label}
                                    </Box>
                                ))}
                            </Stack>
                        )}

                        {inputMode === 0 ? (
                            <>
                                <h3>Ingredients:</h3>
                                <Stack spacing={2} marginBottom={2}>
                                    <TextField value={portions} min="1" type="number" id="portions" name="portions" label="Portions" onWheel={(e) => e.target.blur()} onChange={e => setPortions(e.target.value)} required /><br />
                                    <IngredientList ingredients={ingredients} setIngredients={setIngredients} />
                                </Stack>
                                <Divider sx={{ borderColor: 'var(--input-border)' }} />

                                <h3>Steps:</h3>
                                <div>
                                    <StepsList steps={steps} setSteps={setSteps} />
                                </div>
                            </>
                        ) : (
                            <Stack spacing={1.5} sx={{ mt: 1 }}>
                                <span style={{ color: 'var(--text-color)', fontSize: '0.82rem', opacity: 0.55, fontStyle: 'italic' }}>
                                    Your text will be parsed into a structured recipe - this may take a moment.
                                </span>
                                <TextField
                                    multiline
                                    minRows={10}
                                    maxRows={25}
                                    placeholder={"e.g.\n\nSpaghetti Carbonara\n\n400g spaghetti\n200g pancetta\n4 eggs\n100g parmesan\n\n1. Cook spaghetti…\n2. Fry pancetta…"}
                                    value={importText}
                                    onChange={(e) => setImportText(e.target.value)}
                                    disabled={importing}
                                    slotProps={inputProps}
                                    sx={{ ...textFieldSx, width: '100%' }}
                                />
                            </Stack>
                        )}
                        <Divider sx={{ borderColor: 'var(--input-border)' }} />
                        <br />
                        <Button
                            type={inputMode === 0 ? "submit" : "button"}
                            variant="contained"
                            onClick={inputMode === 0 ? handleSubmit : handleTextImport}
                            disabled={inputMode === 1 && (importing || !importText.trim())}
                            sx={{
                                backgroundColor: 'var(--primary-color)',
                                '&:hover': {
                                    backgroundColor: 'var(--secondary-color)',
                                },
                                fontWeight: "bold",
                                borderRadius: 20,
                                minWidth: 150,
                                alignSelf: 'center',
                            }}
                        >
                            {recipeId === undefined ? "Create" : "Change"}
                        </Button><br />
                        {alertMessage && <Alert severity={alertSeverity}>
                            <AlertTitle>{alertSeverity === "error" ? "Error" : "Info"}</AlertTitle>
                            {alertMessage}
                        </Alert>}
                    </Stack>
                </form>
            </div>

            {(storing || importing || (recipeId !== undefined && !loaded)) && (
                <div className="loading-overlay">
                    <div className="loading-card">
                        <div className="loading-spinner" />
                        <p className="loading-title">
                            {importing ? 'Importing recipe…' : storing ? 'Saving recipe…' : 'Loading recipe…'}
                        </p>
                        <p className="loading-hint">
                            {importing
                                ? 'Parsing your recipe — this may take a moment'
                                : storing
                                    ? 'Almost there…'
                                    : 'Fetching recipe details…'}
                        </p>
                    </div>
                </div>
            )}
            <Footer />
        </div>
    )
}

export default RecipeEditor;