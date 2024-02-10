import json
from abc import ABC, abstractmethod

import mysql.connector
from models import Image, Recipe
from pydantic import ValidationError
from utils import load_config, load_credentials


class Database(ABC):
    """A database class."""

    @abstractmethod
    def create_recipe(self, recipe: dict):
        """Create a new recipe in the database."""

    @abstractmethod
    def get_recipe(self, recipe_id: int):
        """Get a recipe from the database."""

    @abstractmethod
    def get_all_recipes(self):
        """Get all recipes from the database."""

    @abstractmethod
    def update_recipe(self, recipe_id: int, recipe: Recipe):
        """Update a recipe in the database."""

    @abstractmethod
    def delete_recipe(self, recipe_id: int):
        """Delete a recipe from the database."""

    @abstractmethod
    def create_image(self, image: Image):
        """Create a new image in the database."""

    @abstractmethod
    def get_image(self, image_id: int) -> Image:
        """Get an image from the database."""

    @abstractmethod
    def delete_image(self, image_id: int):
        """Delete an image from the database."""


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

    def create_recipe(self, recipe: Recipe):
        """Create a new recipe in the database."""

        sql = "INSERT INTO Recipes (Recipe) VALUES (%s)"
        val = (recipe.model_dump_json(),)
        self.cursor.execute(sql, val)

        self.recipes_database.commit()

    def get_recipe(self, recipe_id: int) -> Recipe:
        """Get a recipe from the database."""

    def get_all_recipes(self) -> list[Recipe]:
        """Get all recipes from the database."""
        self.cursor.execute("SELECT * FROM Recipes")
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

    def update_recipe(self, recipe_id: int, recipe: Recipe):
        """Update a recipe in the database."""

    def delete_recipe(self, recipe_id: int):
        """Delete a recipe from the database."""

    def create_image(self, image: Image):
        """Create a new image in the database."""

    def get_image(self, image_id: int) -> Image:
        """Get an image from the database."""

    def delete_image(self, image_id: int):
        """Delete an image from the database."""


database = MySQLDatabase()
