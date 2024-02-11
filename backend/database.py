import json
from abc import ABC, abstractmethod

import mysql.connector
from exceptions import NotFoundException
from models import Image, Recipe
from pydantic import ValidationError
from utils import load_config, load_credentials


class Database(ABC):
    """A MySQL database class."""

    @abstractmethod
    def create_recipe(self, recipe: dict):
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
    def update_recipe(self, recipe_id: int, recipe: Recipe):
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
    def create_image(self, image: Image):
        """
        Create a new image in the database.

        Returns:
            The ID of the new image.
        """

    @abstractmethod
    def get_image(self, image_id: int) -> Image:
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

        self.cursor = self.recipes_database.cursor()

    def create_recipe(self, recipe: Recipe) -> int:
        """
        Create a new recipe in the database.

        Returns:
            The ID of the new recipe.
        """

        sql = "INSERT INTO Recipes (Recipe) VALUES (%s)"
        val = (recipe.model_dump_json(),)
        self.cursor.execute(sql, val)

        self.recipes_database.commit()

        return self.cursor.lastrowid

    def get_recipe(self, recipe_id: int) -> Recipe:
        """
        Get a recipe from the database.

        Raises:
            NotFoundException if the recipe could not be found.
            ValidationError if the object could not be validated.

        Returns:
            The recipe object.
        """

        sql = "SELECT (RecipeID, Recipe) FROM Recipes WHERE RecipeID = %s"
        val = (recipe_id,)

        self.cursor.execute(sql, val)

        if self.cursor.rowcount == 0:
            raise NotFoundException(
                f"Recipe with id {recipe_id} not found in database."
            )

        id_, recipe = self.cursor.fetchone()

        recipe = json.loads(recipe)
        recipe["id_"] = id_
        return Recipe.model_validate(json.loads(recipe))

    def get_all_recipes(self) -> list[Recipe]:
        """
        Get all recipes from the database.

        Returns:
            A list of recipes.
        """

        self.cursor.execute("SELECT (RecipeID, Recipe) FROM Recipes")
        result = self.cursor.fetchall()

        recipes = []

        for id_, recipe in result:
            recipe = json.loads(recipe)
            recipe["id_"] = id_

            try:
                recipe = Recipe.model_validate(recipe)
                recipes.append(recipe)
            except ValidationError:
                continue

        return recipes

    def update_recipe(self, recipe_id: int, recipe: Recipe) -> bool:
        """
        Update a recipe in the database.

        Returns:
            True if the recipe was updated, False otherwise.
        """

        sql = "UPDATE Recipes SET Recipe = %s WHERE RecipeID = %s"
        val = (recipe.model_dump_json(), recipe_id)

        self.cursor.execute(sql, val)
        self.recipes_database.commit()

        return self.cursor.rowcount > 0

    def delete_recipe(self, recipe_id: int) -> bool:
        """
        Delete a recipe from the database.

        Returns:
            True if the recipe was deleted, False otherwise.
        """

        sql = "DELETE FROM Recipes WHERE RecipeID = %s"
        val = (recipe_id,)

        self.cursor.execute(sql, val)
        self.recipes_database.commit()

        return self.cursor.rowcount > 0

    def create_image(self, image: Image) -> int:
        """
        Create a new image in the database.

        Returns:
            The ID of the new image.
        """

        sql = "INSERT INTO Images (Image) VALUES (%s)"
        val = (image.image,)

        self.cursor.execute(sql, val)
        self.recipes_database.commit()

        return self.cursor.lastrowid

    def get_image(self, image_id: int) -> Image:
        """
        Get an image from the database.

        Raises:
            NotFoundException if the image could not be found.
            ValidationError if the image could not be validated.

        Returns:
            The image object.
        """

        sql = "SELECT (ImageID, Image) FROM Images WHERE ImageID = %s"
        val = (image_id,)

        self.cursor.execute(sql, val)

        if self.cursor.rowcount == 0:
            raise NotFoundException(f"Image with id {image_id} not found in database.")

        id_, image = self.cursor.fetchone()

        return Image(id_=id_, image=image)

    def delete_image(self, image_id: int) -> bool:
        """
        Delete an image from the database.

        Returns:
            True if the image was deleted, False otherwise.
        """

        sql = "DELETE FROM Images WHERE ImageID = %s"
        val = (image_id,)

        self.cursor.execute(sql, val)
        self.recipes_database.commit()

        return self.cursor.rowcount > 0


database = MySQLDatabase()
