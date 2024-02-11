import json
from abc import ABC, abstractmethod

import mysql.connector
from exceptions import NotFoundException
from models import Image, ImageBase, Recipe, RecipeBase
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
    def update_recipe(self, recipe: Recipe):
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

    def create_recipe(self, recipe: RecipeBase) -> int:
        """
        Create a new recipe in the database.

        Returns:
            The ID of the new recipe.
        """
        cursor = self.recipes_database.cursor()

        sql = "INSERT INTO Recipes (Recipe) VALUES (%s)"
        val = (recipe.model_dump_json(),)
        cursor.execute(sql, val)

        self.recipes_database.commit()

        return cursor.lastrowid

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

        sql = "SELECT RecipeID, Recipe FROM Recipes WHERE RecipeID = %s"
        val = (recipe_id,)

        cursor.execute(sql, val)

        result = cursor.fetchone()

        if cursor.rowcount == 0:
            raise NotFoundException(
                f"Recipe with id {recipe_id} not found in database."
            )

        id_, recipe = result
        recipe = json.loads(recipe)
        recipe["id_"] = id_
        return Recipe(**recipe)

    def get_all_recipes(self) -> list[Recipe]:
        """
        Get all recipes from the database.

        Returns:
            A list of recipes.
        """

        cursor = self.recipes_database.cursor()

        cursor.execute("SELECT RecipeID, Recipe FROM Recipes")
        result = cursor.fetchall()

        recipes = []

        for id_, recipe in result:
            recipe = json.loads(recipe)
            recipe["id_"] = id_

            try:
                recipe = Recipe(**recipe)
                recipes.append(recipe)
            except ValidationError:
                continue

        return recipes

    def update_recipe(self, recipe: Recipe) -> bool:
        """
        Update a recipe in the database.

        Returns:
            True if the recipe was updated, False otherwise.
        """

        cursor = self.recipes_database.cursor()

        sql = "UPDATE Recipes SET Recipe = %s WHERE RecipeID = %s"
        val = (recipe.model_dump_json(), recipe.id_)

        cursor.execute(sql, val)
        self.recipes_database.commit()

        return cursor.rowcount > 0

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

        return cursor.rowcount > 0

    def create_image(self, image: ImageBase) -> int:
        """
        Create a new image in the database.

        Returns:
            The ID of the new image.
        """

        cursor = self.recipes_database.cursor()

        sql = "INSERT INTO Images (Image) VALUES (%s)"
        val = (image.image,)

        cursor.execute(sql, val)
        self.recipes_database.commit()

        return cursor.lastrowid

    def get_image(self, image_id: int) -> Image:
        """
        Get an image from the database.

        Raises:
            NotFoundException: if the image could not be found.
            ValidationError: if the image could not be validated.

        Returns:
            The image object.
        """

        cursor = self.recipes_database.cursor()

        sql = "SELECT ImageID, Image FROM Images WHERE ImageID = %s"
        val = (image_id,)

        cursor.execute(sql, val)

        result = cursor.fetchone()
        if cursor.rowcount == 0:
            raise NotFoundException(f"Image with id {image_id} not found in database.")

        id_, image = result

        return Image(id_=id_, image=image)

    def delete_image(self, image_id: int) -> bool:
        """
        Delete an image from the database.

        Returns:
            True if the image was deleted, False otherwise.
        """

        cursor = self.recipes_database.cursor()

        sql = "DELETE FROM Images WHERE ImageID = %s"
        val = (image_id,)

        cursor.execute(sql, val)
        self.recipes_database.commit()

        return cursor.rowcount > 0


database = MySQLDatabase()
