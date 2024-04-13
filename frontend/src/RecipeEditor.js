import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import RemoveCircleOutlineOutlinedIcon from '@mui/icons-material/RemoveCircleOutlineOutlined';
import { Alert, AlertTitle, Autocomplete, Button, Divider, MenuItem, Stack, TextField } from '@mui/material';
import styled from '@mui/material/styles/styled';
import React, { useEffect, useState } from 'react';
import { ThreeDots } from 'react-loader-spinner';
import { Link, useParams } from "react-router-dom";
import { API_BASE } from './Config';
import Header from "./Header";

import './RecipeEditor.css';

const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch(API_BASE + 'image/create', {
        method: 'POST',
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

const deleteImage = async (id) => {
    const response = await fetch(API_BASE + 'image/' + id, {
        method: 'DELETE',
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

function Ingredient({ ingredient, onChangeIngredient, onChangeAmount, onChangeUnit, onDelete }) {
    if (ingredient === null) {
        ingredient = { name: "", amount: 0, unit: "g", group: "" };
    }
    return (
        <Stack direction="row" spacing={2}>
            <TextField type="text" id="ingredient" name="ingredient" label="Ingredient" onChange={onChangeIngredient} value={ingredient.name} />
            <TextField min="0" type="number" id="amount" name="amount" label="Amount" onChange={onChangeAmount} value={ingredient.amount} />
            <TextField select label="Select" id="unit" name="unit" defaultValue={"g"} onChange={onChangeUnit} value={ingredient.unit} >
                {measureUnits.map((option) => (
                    <MenuItem key={option} value={option}>
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
        newIngredients.forEach((group, groupIndex) => {
            if (group.ingredients.length === 0 || group.ingredients[group.ingredients.length - 1].name !== "") {
                group.ingredients.push({ name: "", amount: 0, unit: "g", group: "" });
            }
            // If there are two empty ingredients at the end, remove the last one
            else if (group.ingredients.length > 1 && group.ingredients[group.ingredients.length - 2].name === "") {
                group.ingredients = group.ingredients.slice(0, -1);
            }
        });
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
            <button onClick={addIngredientGroup}>Add ingredient group</button>
        </Stack>
    );
};

function Step({ index, step, onChangeDesciption, onDelete, onUploadImage, onDeleteImage }) {

    return (
        <div>
            <Stack direction={'row'} spacing={2} style={{ marginBottom: 10 }}>
                <span>{index}.</span>
                <Stack direction={'column'} spacing={1}>
                    <Stack direction={'row'} spacing={2} style={{ marginBottom: 10 }}>
                        <TextField type="text" id="step" name="step" label="Instruction" onChange={onChangeDesciption} value={step.description} />
                        <UploadButton component="label" variant="contained" htmlFor={"step_image" + index} startIcon={<CloudUploadIcon />}>
                            Image
                            <VisuallyHiddenInput type="file" id={"step_image" + index} name="step_image" accept="image/*" onChange={onUploadImage} />
                        </UploadButton><br />
                        {step.description !== "" && < button type='button' onClick={onDelete} className='clearBtn'><RemoveCircleOutlineOutlinedIcon /></button>}
                    </Stack>
                    {step.images.length > 0 && imagesList(step.images, "stepImg", onDeleteImage, "deleteIconStep")}
                </Stack>
            </Stack>
        </div>
    )
}

const StepsList = ({ steps, setSteps }) => {
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
        uploadImage(file).then(id_ => {
            let step = newSteps[index];
            step.images.push(id_);
            newSteps[index] = step;
            setSteps(newSteps);
            event.target.value = null;
        });
    }

    const deleteStepImageOnChange = (index) => async (id) => {
        const newSteps = [...steps];
        deleteImage(id).then(() => {
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

    const [filters, setFilters] = useState(defaultFilters);

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

    const uploadGalleryImageOnChange = async (event) => {
        const file = event.target.files[0];
        uploadImage(file).then(id_ => { if (id_ !== -1) setGalleryImages([...galleryImages, id_]); event.target.value = null });
    }

    const deleteGalleryImageOnChange = async (id) => {
        deleteImage(id).then(() => setGalleryImages(galleryImages.filter(image => image !== id)));
    }

    const uploadCoverImageOnChange = async (event) => {
        const file = event.target.files[0];
        uploadImage(file).then(id_ => { setCoverImage(id_); console.log("set cover image to" + id_); event.target.value = null });
    }

    const deleteCoverImageOnChange = async (id) => {
        deleteImage(id).then(() => setCoverImage(""));
    }

    return (
        <div className="main">
            <Header />
            <div className={"content " + (storing || (recipeId !== undefined && !loaded) ? 'hidden' : '')}>
                <h1>{recipeId === undefined ? "Create a new recipe" : "Edit your recipe"}</h1>
                <form onSubmit={handleSubmit}>
                    <Stack>
                        <TextField id="title" name="title" label="Title" value={title} onChange={e => setTitle(e.target.value)} required /><br />
                        <TextField id="description" name="description" label="Description" value={description} onChange={e => setDescription(e.target.value)} required /><br />
                        <TextField id="cookingTime" name="cookingTime" label="Cooking time in minutes" type="number" value={cookingTime} onChange={e => setCookingTime(e.target.value)} required /><br />
                        <Autocomplete
                            disablePortal
                            options={filters}
                            sx={{ width: 300 }}
                            freeSolo
                            multiple
                            value={categories}
                            onChange={(_, value) => { setCategories(value) }}
                            renderInput={(params) => <TextField {...params} label="Categories" />}
                        /><br />
                        <Divider />

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

                        <Divider />

                        <h3>Ingredients:</h3>
                        <Stack spacing={2} marginBottom={2}>
                            <TextField value={portions} min="1" type="number" id="portions" name="portions" label="Portions" onChange={e => setPortions(e.target.value)} required /><br />
                            <IngredientList ingredients={ingredients} setIngredients={setIngredients} />
                        </Stack>
                        <Divider />

                        <h3>Steps:</h3>
                        <div>
                            <StepsList steps={steps} setSteps={setSteps} />
                        </div>
                        <Divider />
                        <br />
                        <button type="submit">{recipeId === undefined ? "Create" : "Change"}</button><br />
                        {alertMessage && <Alert severity="error">
                            <AlertTitle>Error</AlertTitle>
                            {alertMessage}
                        </Alert>}
                    </Stack>
                </form>
            </div>

            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
            }}>
                <ThreeDots
                    visible={storing || (recipeId !== undefined && !loaded)}
                    height="80"
                    width="80"
                    color="var(--dark-green)"
                    radius="9"
                    ariaLabel="three-dots-loading"
                    wrapperStyle={{}}
                    wrapperClass=""
                />
            </div>
            <footer><Link to="/legalnotice">Impressum</Link></footer>
        </div>
    )
}

export default RecipeEditor;