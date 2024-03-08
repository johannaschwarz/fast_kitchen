import json
from abc import ABC, abstractmethod

import mysql.connector
from exceptions import NotFoundException, UpdateFailedException
from models import (
    ImageBase,
    Ingredient,
    Recipe,
    RecipeBase,
    RecipeListing,
    RecipeStored,
    UnitEnum,
)
from pydantic import ValidationError
from utils import load_config, load_credentials


class Database(ABC):
    """A MySQL database class."""

    @abstractmethod
    def create_recipe(self, recipe: RecipeBase):
        """
        Create a new recipe in the database.

        Returns:
            The ID of the new recipe.
        """

    @abstractmethod
    def get_recipe(self, recipe_id: int):
        """
        Get a recipe from the database.

        Raises:
            NotFoundException if the recipe could not be found.
            ValidationError if the object could not be validated.

        Returns:
            The recipe object.
        """

    @abstractmethod
    def get_all_recipes(self):
        """
        Get all recipes from the database.

        Returns:
            A list of recipes.
        """

    @abstractmethod
    def update_recipe(self, recipe: RecipeStored):
        """
        Update a recipe in the database.

        Returns:
            True if the recipe was updated, False otherwise.
        """

    @abstractmethod
    def delete_recipe(self, recipe_id: int):
        """
        Delete a recipe from the database.

        Returns:
            True if the recipe was deleted, False otherwise.
        """

    @abstractmethod
    def create_image(self, image: ImageBase):
        """
        Create a new image in the database.

        Returns:
            The ID of the new image.
        """

    @abstractmethod
    def get_image(self, image_id: int) -> bytes:
        """
        Get an image from the database.

        Raises:
            NotFoundException if the image could not be found.
            ValidationError if the image could not be validated.

        Returns:
            The image object.
        """

    @abstractmethod
    def delete_image(self, image_id: int):
        """
        Delete an image from the database.

        Returns:
            True if the image was deleted, False otherwise.
        """


class MySQLDatabase(Database):
    """A MySQL database class."""

    CONFIG = load_config()
    CREDENTIALS = load_credentials()

    def __init__(self):

        self.recipes_database = mysql.connector.connect(
            host=self.CONFIG["database_ip"],
            port=int(self.CONFIG["database_port"]),
            user=self.CREDENTIALS["database_user"],
            password=self.CREDENTIALS["database_password"],
            database=self.CREDENTIALS["database_name"],
        )

    def create_recipe(self, recipe: RecipeBase) -> int:
        """
        Create a new recipe in the database.

        Returns:
            The ID of the new recipe.
        """
        cursor = self.recipes_database.cursor()

        sql = "INSERT INTO Recipes (Title, Description, RecipeSteps, CookingTime) VALUES (%s, %s, %s, %s)"
        val = (
            recipe.title,
            recipe.description,
            json.dumps(recipe.steps),
            recipe.cooking_time,
        )
        cursor.execute(sql, val)

        self.recipes_database.commit()
        id_ = cursor.lastrowid
        cursor.close()

        for category in recipe.categories:
            self.create_category(category, id_)

        for ingredient in recipe.ingredients:
            self.create_ingredient(ingredient, id_)

        return id_

    def get_recipe(self, recipe_id: int) -> Recipe:
        """
        Get a recipe from the database.

        Raises:
            NotFoundException: if the recipe could not be found.
            ValidationError: if the object could not be validated.

        Returns:
            The recipe object.
        """
        cursor = self.recipes_database.cursor()

        sql = "SELECT RecipeID, Title, Description, RecipeSteps, CookingTime, CoverImage FROM Recipes WHERE RecipeID = %s"
        val = (recipe_id,)

        cursor.execute(sql, val)

        result = cursor.fetchone()

        if cursor.rowcount == 0:
            cursor.close()
            raise NotFoundException(
                f"Recipe with id {recipe_id} not found in database."
            )

        id_, title, description, steps, cooking_time, cover_image = result
        steps = json.loads(steps)

        categories = self.get_categories_by_recipe(id_)
        ingredients = self.get_ingredients_by_recipe(id_)
        images = self.get_images_by_recipe(id_)

        cursor.close()
        return Recipe(
            id_=id_,
            title=title,
            description=description,
            ingredients=ingredients,
            cooking_time=cooking_time,
            steps=steps,
            categories=categories,
            cover_image=cover_image,
            images=images,
        )

    def get_all_recipes(self) -> list[RecipeListing]:
        """
        Get all recipes from the database.

        Returns:
            A list of recipes.
        """
        cursor = self.recipes_database.cursor()

        cursor.execute("SELECT RecipeID, Title, Description, CoverImage FROM Recipes")
        result = cursor.fetchall()
        cursor.close()

        recipes = []

        for id_, title, description, image in result:
            try:
                recipes.append(
                    RecipeListing(
                        id_=id_,
                        title=title if title else "",
                        description=description if description else "",
                        cover_image=image,
                    )
                )
            except ValidationError:
                print(f"Recipe with id {id_} could not be validated.")
                continue

        return recipes

    def get_recipes_by_category(self, category: str) -> list[int]:
        """
        Get all recipes by category from the database.

        Returns:
            A list of recipe IDs.
        """

        cursor = self.recipes_database.cursor()

        sql = "SELECT RecipeID FROM Categories WHERE Category = %s"
        val = (category,)
        cursor.execute(sql, val)

        result = cursor.fetchall()

        cursor.close()
        return [recipe_id for recipe_id, in result]

    def update_recipe(self, recipe: RecipeStored):
        """
        Update a recipe in the database.

        Raises:
            UpdateFailedException: if the recipe could not be updated.

        Returns:
            True if the recipe was updated, False otherwise.
        """

        cursor = self.recipes_database.cursor()

        sql = "UPDATE Recipes SET Title = %s, Description = %s, RecipeSteps = %s, CoverImage = %s WHERE RecipeID = %s"
        val = (
            recipe.title,
            recipe.description,
            json.dumps(recipe.steps),
            recipe.cover_image,
            recipe.id_,
        )

        cursor.execute(sql, val)
        self.recipes_database.commit()

        if cursor.rowcount == 0:
            cursor.close()
            raise UpdateFailedException(
                f"Recipe with id {recipe.id_} could not be updated."
            )

        cursor.close()

        self.update_categories_by_recipe(recipe.id_, recipe.categories)
        self.update_ingredients_by_recipe(recipe.id_, recipe.ingredients)

    def delete_recipe(self, recipe_id: int) -> bool:
        """
        Delete a recipe from the database.

        Returns:
            True if the recipe was deleted, False otherwise.
        """

        cursor = self.recipes_database.cursor()

        sql = "DELETE FROM Recipes WHERE RecipeID = %s"
        val = (recipe_id,)

        cursor.execute(sql, val)
        self.recipes_database.commit()

        if cursor.rowcount == 0:
            cursor.close()
            raise NotFoundException(
                f"Recipe with id {recipe_id} not found in database."
            )

        cursor.close()

    def create_image(self, image: ImageBase) -> int:
        """
        Create a new image in the database.

        Returns:
            The ID of the new image.
        """

        cursor = self.recipes_database.cursor()

        sql = "INSERT INTO Images (RecipeID, Image) VALUES (%s, %s)"
        val = (image.recipe_id, image.image)

        cursor.execute(sql, val)
        self.recipes_database.commit()

        id_ = cursor.lastrowid

        cursor.close()
        return id_

    def get_image(self, image_id: int) -> bytes:
        """
        Get an image from the database.

        Raises:
            NotFoundException: if the image could not be found.
            ValidationError: if the image could not be validated.

        Returns:
            The image object.
        """

        cursor = self.recipes_database.cursor()

        sql = "SELECT Image FROM Images WHERE ImageID = %s"
        val = (image_id,)

        cursor.execute(sql, val)

        result = cursor.fetchone()
        if cursor.rowcount == 0:
            cursor.close()
            raise NotFoundException(f"Image with id {image_id} not found in database.")

        cursor.close()
        return result[0]

    def get_images_by_recipe(self, recipe_id: int) -> list[int]:
        """
        Get all images for a recipe from the database.

        Returns:
            A list of images.
        """

        cursor = self.recipes_database.cursor()

        sql = "SELECT ImageID FROM Images WHERE RecipeID = %s"
        val = (recipe_id,)

        cursor.execute(sql, val)

        result = cursor.fetchall()

        cursor.close()
        return [image_id for (image_id,) in result]

    def delete_image(self, image_id: int):
        """
        Delete an image from the database.

        Raises:
            NotFoundException: if the image could not be found.
        """

        cursor = self.recipes_database.cursor()

        sql = "DELETE FROM Images WHERE ImageID = %s"
        val = (image_id,)

        cursor.execute(sql, val)
        self.recipes_database.commit()

        if cursor.rowcount == 0:
            cursor.close()
            raise NotFoundException(f"Image with id {image_id} not found in database.")

        cursor.close()

    def create_category(self, category: str, recipe_id: int):
        """
        Create a new category in the database.
        """

        cursor = self.recipes_database.cursor()

        sql = "INSERT INTO Categories (RecipeID, Category) VALUES (%s, %s)"
        val = (recipe_id, category)

        cursor.execute(sql, val)
        self.recipes_database.commit()

        cursor.close()

    def get_categories_by_recipe(self, recipe_id: int) -> list[str]:
        """
        Get all categories for a recipe from the database.

        Returns:
            A list of categories.
        """

        cursor = self.recipes_database.cursor()

        sql = "SELECT Category FROM Categories WHERE RecipeID = %s"
        val = (recipe_id,)

        cursor.execute(sql, val)

        result = cursor.fetchall()

        cursor.close()
        return [category for category, in result]

    def update_categories_by_recipe(self, recipe_id: int, categories: list[str]):
        """
        Update the categories for a recipe in the database.
        """

        cursor = self.recipes_database.cursor()

        sql = "DELETE FROM Categories WHERE RecipeID = %s"
        val = (recipe_id,)

        cursor.execute(sql, val)
        self.recipes_database.commit()

        for category in categories:
            self.create_category(category, recipe_id)

        cursor.close()

    def delete_category(self, category: str, recipe_id: int):
        """
        Delete a category from the database.

        Raises:
            NotFoundException: if the category could not be found.
        """

        cursor = self.recipes_database.cursor()

        sql = "DELETE FROM Categories WHERE RecipeID = %s AND Category = %s"
        val = (recipe_id, category)

        cursor.execute(sql, val)
        self.recipes_database.commit()

        if cursor.rowcount == 0:
            cursor.close()
            raise NotFoundException(
                f"Category {category} for recipe {recipe_id} not found."
            )

        cursor.close()

    def create_ingredient(self, ingredient: Ingredient, recipe_id: int):
        """
        Create a new ingredient in the database.
        """

        cursor = self.recipes_database.cursor()

        sql = "INSERT INTO Ingredients (RecipeID, Ingredient, Unit, Amount, IngredientGroup) VALUES (%s, %s, %s, %s, %s)"
        val = (
            recipe_id,
            ingredient.name,
            ingredient.unit,
            ingredient.amount,
            ingredient.group,
        )

        cursor.execute(sql, val)
        self.recipes_database.commit()

        cursor.close()

    def get_ingredients_by_recipe(self, recipe_id: int) -> list[Ingredient]:
        """
        Get all ingredients for a recipe from the database.

        Returns:
            A list of ingredients.
        """

        cursor = self.recipes_database.cursor()

        sql = "SELECT Ingredient, Unit, Amount, IngredientGroup FROM Ingredients WHERE RecipeID = %s"
        val = (recipe_id,)

        cursor.execute(sql, val)

        result = cursor.fetchall()

        cursor.close()
        return [
            Ingredient(name=ingredient, unit=UnitEnum(unit), amount=amount, group=group)
            for ingredient, unit, amount, group in result
        ]

    def update_ingredients_by_recipe(
        self, recipe_id: int, ingredients: list[Ingredient]
    ):
        """
        Update the ingredients for a recipe in the database.
        """

        cursor = self.recipes_database.cursor()

        sql = "DELETE FROM Ingredients WHERE RecipeID = %s"
        val = (recipe_id,)

        cursor.execute(sql, val)
        self.recipes_database.commit()

        for ingredient in ingredients:
            self.create_ingredient(ingredient, recipe_id)

        cursor.close()

    def close(self):
        self.recipes_database.close()
