from abc import ABC, abstractmethod
from enum import StrEnum

import mysql.connector
from pydantic import ValidationError

from exceptions import NotFoundException
from models import (Ingredient, Recipe, RecipeBase, RecipeListing, RecipeStep,
                    UnitEnum, UserInDB)
from utils import load_config, load_credentials


class SortByEnum(StrEnum):
    """Enum for sorting options."""

    CLICKS = "Clicks"
    TITLE = "Title"
    ID = "RecipeID"
    COOKING_TIME = "CookingTime"


class SortOrderEnum(StrEnum):
    """Enum for sorting options."""

    ASC = "ASC"
    DESC = "DESC"


class Database(ABC):
    """A MySQL database class."""

    @abstractmethod
    def create_recipe(self, recipe: RecipeBase, user: UserInDB):
        """
        Create a new recipe in the database.

        Returns:
            The ID of the new recipe.
        """

    @abstractmethod
    def get_recipe(self, recipe_id: int) -> Recipe:
        """
        Get a recipe from the database.

        Raises:
            NotFoundException if the recipe could not be found.
            ValidationError if the object could not be validated.

        Returns:
            The recipe object.
        """

    @abstractmethod
    def get_all_recipes(
        self,
        limit: int | None = None,
        page: int | None = None,
        search_string: str | None = None,
        filter_categories: list[str] | None = None,
        sort_by: SortByEnum = SortByEnum.CLICKS,
        sort_order: SortOrderEnum = SortOrderEnum.DESC,
    ) -> list[RecipeListing]:
        """
        Get all recipes that respect the given filters from the database.

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
    def is_authorized(self, user_id: int, recipe_id: int) -> bool:
        """Check if the user is authorized to access the recipe."""

    @abstractmethod
    def create_image(self, image: bytes) -> int:
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

        Raises:
            NotFoundException if the image could not be found.
        """

    @abstractmethod
    def get_categories(self) -> list[str]:
        """
        Get all categories from the database.

        Returns:
            A list of categories.
        """

    @abstractmethod
    def get_user_by_username(self, username: str) -> UserInDB:
        """
        Get a user from the database using the username.

        Raises:
            NotFoundException if the user could not be found.

        Returns:
            The user object.
        """

    @abstractmethod
    def get_user_by_id(self, user_id: int) -> UserInDB:
        """
        Get a user from the database using the user ID.

        Raises:
            NotFoundException if the user could not be found.

        Returns:
            The user object.
        """

    @abstractmethod
    def create_user(
        self, username: str, password: str, is_admin: bool
    ) -> UserInDB | None:
        """
        Create a new user in the database.

        Returns:
            The user object.
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

    def create_recipe(self, recipe: RecipeBase, user: UserInDB) -> int:
        """
        Create a new recipe in the database.

        Returns:
            The ID of the new recipe.
        """
        cursor = self.recipes_database.cursor()

        sql = "INSERT INTO Recipes (Title, Description, CookingTime, CoverImage, Portions, UserID) VALUES (%s, %s, %s, %s, %s, %s)"
        val = (
            recipe.title,
            recipe.description,
            recipe.cooking_time,
            recipe.cover_image if recipe.cover_image > 0 else None,
            recipe.portions,
            user.id_,
        )
        cursor.execute(sql, val)

        self.recipes_database.commit()
        id_ = cursor.lastrowid
        cursor.close()

        for category in recipe.categories:
            self.create_category(category, id_)

        for ingredient in recipe.ingredients:
            self._create_ingredient(ingredient, id_)

        if recipe.gallery_images:
            for image_id in recipe.gallery_images:
                self._add_recipe_to_image(id_, image_id)

        for step in recipe.steps:
            self._create_recipe_step(step, id_)

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
        self._increase_clicks_for_recipe(recipe_id)

        cursor = self.recipes_database.cursor()

        sql = "SELECT RecipeID, Title, Description, CookingTime, CoverImage, Portions, UserID, Clicks FROM Recipes WHERE RecipeID = %s"
        val = (recipe_id,)

        cursor.execute(sql, val)

        result = cursor.fetchone()

        if cursor.rowcount == 0:
            cursor.close()
            raise NotFoundException(
                f"Recipe with id {recipe_id} not found in database."
            )

        (
            id_,
            title,
            description,
            cooking_time,
            cover_image,
            portions,
            user_id,
            clicks,
        ) = result

        categories = self.get_categories_by_recipe(id_)
        ingredients = self._get_ingredients_by_recipe(id_)
        images = self._get_gallery_images_by_recipe(id_)
        steps = self._get_recipe_steps_by_recipe(id_)
        username = self.get_user_by_id(user_id).username if user_id else None

        cursor.close()
        return Recipe(
            id_=id_,
            title=title,
            creator_name=username,
            creator_id=user_id if user_id else None,
            description=description,
            ingredients=ingredients,
            portions=portions,
            cooking_time=cooking_time,
            steps=steps,
            categories=categories,
            cover_image=cover_image,
            gallery_images=images,
            clicks=clicks,
        )

    def _increase_clicks_for_recipe(self, recipe_id: int):
        """
        Increase the number of clicks for a recipe in the database.
        """

        cursor = self.recipes_database.cursor()

        sql = "UPDATE Recipes SET Clicks = Clicks + 1 WHERE RecipeID = %s"
        val = (recipe_id,)

        cursor.execute(sql, val)
        self.recipes_database.commit()

        cursor.close()

    def get_all_recipes(
        self,
        limit: int | None = None,
        page: int | None = None,
        search_string: str | None = None,
        filter_categories: list[str] | None = None,
        sort_by: SortByEnum = SortByEnum.CLICKS,
        sort_order: SortOrderEnum = SortOrderEnum.DESC,
    ) -> list[RecipeListing]:
        """
        Get all recipes from the database.

        Returns:
            A list of recipes.
        """
        if not search_string:
            search_string = ""

        cursor = self.recipes_database.cursor(prepared=True)

        if limit:
            limitation_query = " LIMIT %s"
            limit_parameters = (limit,)
            if page:
                limitation_query += " OFFSET %s"
                limit_parameters = (limit, (page - 1) * limit)
        else:
            limitation_query = ""
            limit_parameters = tuple()

        if filter_categories:
            cursor.execute(
                f"SELECT DISTINCT r.RecipeID, r.Title, r.Description, r.CoverImage, r.UserID, r.Clicks, r.CookingTime FROM Recipes r, Categories c WHERE (r.Title LIKE CONCAT('%', %s, '%') OR r.Description LIKE CONCAT('%', %s, '%')) AND c.RecipeID = r.RecipeID AND c.Category IN ({', '.join(['%s'] * len(filter_categories))}) GROUP BY r.RecipeID HAVING COUNT(c.Category) = %s ORDER BY {sort_by} {sort_order} {limitation_query};",
                (
                    search_string,
                    search_string,
                    *filter_categories,
                    len(filter_categories),
                )
                + limit_parameters,
            )
        else:
            cursor.execute(
                f"SELECT RecipeID, Title, Description, CoverImage, UserID, Clicks, CookingTime FROM Recipes WHERE Title LIKE CONCAT('%', %s, '%') OR Description LIKE CONCAT('%', %s, '%') ORDER BY {sort_by} {sort_order} {limitation_query}",
                (search_string, search_string) + limit_parameters,
            )
        result = cursor.fetchall()
        cursor.close()

        recipes = []

        for id_, title, description, image, user_id, clicks, cooking_time in result:
            categories = self.get_categories_by_recipe(id_)
            if not image:
                images = self._get_gallery_images_by_recipe(id_)
                image = images[0] if images else None
            try:
                recipes.append(
                    RecipeListing(
                        id_=id_,
                        title=title if title else "",
                        description=description if description else "",
                        cover_image=image,
                        categories=categories,
                        creator=(
                            self.get_user_by_id(user_id).username if user_id else None
                        ),
                        clicks=clicks,
                        cooking_time=cooking_time,
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

    def update_recipe(self, recipe: Recipe):
        """
        Update a recipe in the database.

        Raises:
            UpdateFailedException: if the recipe could not be updated.
        """
        cursor = self.recipes_database.cursor()

        sql = "UPDATE Recipes SET Title = %s, Description = %s, CookingTime = %s, CoverImage = %s, Portions = %s WHERE RecipeID = %s"
        val = (
            recipe.title,
            recipe.description,
            recipe.cooking_time,
            recipe.cover_image if recipe.cover_image > 0 else None,
            recipe.portions,
            recipe.id_,
        )

        cursor.execute(sql, val)
        self.recipes_database.commit()

        cursor.close()

        self._update_categories_by_recipe(recipe)
        self._update_ingredients_by_recipe(recipe)
        self._update_images_by_recipe(recipe)
        self._update_recipe_steps_by_recipe(recipe)

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

    def is_authorized(self, user_id: int, recipe_id: int) -> bool:
        """Check if the user is authorized to access the recipe."""
        cursor = self.recipes_database.cursor()

        sql = "SELECT IsAdmin, Disabled FROM Users WHERE UserID = %s"
        val = (user_id,)
        cursor.execute(sql, val)
        (is_admin, disabled) = cursor.fetchone()

        cursor.close()
        if disabled:
            return False
        if is_admin:
            return True

        cursor = self.recipes_database.cursor()
        sql = "SELECT UserId FROM Recipes WHERE RecipeID = %s"
        val = (recipe_id,)

        cursor.execute(sql, val)
        result = cursor.fetchone()
        cursor.close()

        return result[0] == user_id

    def _create_recipe_step(self, recipe_step: RecipeStep, recipe_id: int):
        """
        Create a new recipe step in the database.

        Returns:
            The ID of the new recipe step.
        """

        cursor = self.recipes_database.cursor()

        sql = "INSERT INTO RecipeSteps (RecipeID, OrderID, Step) VALUES (%s, %s, %s)"
        val = (recipe_id, recipe_step.order_id, recipe_step.step)

        cursor.execute(sql, val)
        self.recipes_database.commit()

        id_ = cursor.lastrowid

        cursor.close()

        for image_id in recipe_step.images:
            self._add_recipe_step_to_image(id_, image_id)

    def _get_recipe_steps_by_recipe(self, recipe_id: int) -> list[RecipeStep]:
        """
        Get all recipe steps for a recipe from the database.

        Returns:
            A list of recipe steps.
        """

        cursor = self.recipes_database.cursor()

        sql = "SELECT StepID, OrderID, Step FROM RecipeSteps WHERE RecipeID = %s"
        val = (recipe_id,)

        cursor.execute(sql, val)

        result = cursor.fetchall()

        cursor.close()

        steps = []

        for step_id, order_id, step in result:
            images = self._get_images_by_recipe_step(step_id)
            steps.append(RecipeStep(order_id=order_id, step=step, images=images))

        return steps

    def _update_recipe_steps_by_recipe(self, recipe: Recipe):
        """Update the steps for a recipe in the database."""
        cursor = self.recipes_database.cursor()

        sql = "Delete FROM RecipeSteps WHERE RecipeID = %s"
        val = (recipe.id_,)
        cursor.execute(sql, val)
        self.recipes_database.commit()
        cursor.close()

        for step in recipe.steps:
            self._create_recipe_step(step, recipe.id_)

    def create_image(self, image: bytes) -> int:
        """
        Create a new image in the database.

        Returns:
            The ID of the new image.
        """

        cursor = self.recipes_database.cursor()

        sql = "INSERT INTO Images (Image) VALUES (%s)"
        val = (image,)

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

    def _get_gallery_images_by_recipe(self, recipe_id: int) -> list[int]:
        """
        Get all gallery images for a recipe from the database.

        Returns:
            A list of images.
        """

        cursor = self.recipes_database.cursor()

        sql = "SELECT i.ImageID FROM Images i, Recipes r WHERE i.RecipeID = %s AND r.RecipeID = i.RecipeID AND i.StepID IS NULL AND i.ImageID != r.CoverImage"
        val = (recipe_id,)

        cursor.execute(sql, val)

        result = cursor.fetchall()

        cursor.close()
        return [image_id for (image_id,) in result]

    def _update_images_by_recipe(self, recipe: Recipe):
        """
        Update the images for a recipe in the database.
        """

        cursor = self.recipes_database.cursor()

        sql = "SELECT ImageID FROM Images WHERE RecipeID = %s"
        val = (recipe.id_,)
        cursor.execute(sql, val)

        recipe_images = set(recipe.gallery_images) | {recipe.cover_image}

        current_images = [image_id for (image_id,) in cursor.fetchall()]
        deleted_images = [
            image_id for image_id in current_images if image_id not in recipe_images
        ]
        added_images = [
            image_id for image_id in recipe_images if image_id not in current_images
        ]

        cursor.close()

        for image_id in deleted_images:
            self._delete_image(image_id)

        for image_id in added_images:
            self._add_recipe_to_image(recipe.id_, image_id)

    def _add_recipe_to_image(self, recipe_id: int, image_id: int):
        """
        Add a recipe to an image in the database.
        """
        cursor = self.recipes_database.cursor()

        sql = "UPDATE Images SET RecipeID = %s WHERE ImageID = %s"
        val = (recipe_id, image_id)

        cursor.execute(sql, val)
        self.recipes_database.commit()

        cursor.close()

    def _add_recipe_step_to_image(self, step_id: int, image_id: int):
        """
        Add a recipe step to an image in the database.
        """
        cursor = self.recipes_database.cursor()

        sql = "UPDATE Images SET StepID = %s WHERE ImageID = %s"
        val = (step_id, image_id)

        cursor.execute(sql, val)
        self.recipes_database.commit()

        cursor.close()

    def _get_images_by_recipe_step(self, step_id: int) -> list[int]:
        """
        Get all images for a recipe step from the database.

        Returns:
            A list of images.
        """

        cursor = self.recipes_database.cursor()

        sql = "SELECT ImageID FROM Images WHERE StepID = %s"
        val = (step_id,)

        cursor.execute(sql, val)

        result = cursor.fetchall()

        cursor.close()
        return [image_id for (image_id,) in result]

    def _delete_image(self, image_id: int):
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

    def delete_unused_images(self):
        """
        Delete all images that are not used in any recipe.
        """

        cursor = self.recipes_database.cursor()

        sql = "DELETE FROM Images WHERE RecipeID IS NULL AND TimeStamp < DATE_SUB(NOW(), INTERVAL 1 DAY)"
        cursor.execute(sql)

        self.recipes_database.commit()
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

    def _update_categories_by_recipe(self, recipe: Recipe):
        """
        Update the categories for a recipe in the database.
        """

        cursor = self.recipes_database.cursor()

        sql = "DELETE FROM Categories WHERE RecipeID = %s"
        val = (recipe.id_,)

        cursor.execute(sql, val)
        self.recipes_database.commit()

        for category in recipe.categories:
            self.create_category(category, recipe.id_)

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

    def get_categories(self) -> list[str]:
        """
        Get all categories from the database.

        Returns:
            A list of categories.
        """

        cursor = self.recipes_database.cursor()

        sql = "SELECT DISTINCT Category FROM Categories"
        cursor.execute(sql)

        result = cursor.fetchall()

        cursor.close()
        return [category for category, in result]

    def _create_ingredient(self, ingredient: Ingredient, recipe_id: int):
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

    def _get_ingredients_by_recipe(self, recipe_id: int) -> list[Ingredient]:
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

    def _update_ingredients_by_recipe(self, recipe: Recipe):
        """
        Update the ingredients for a recipe in the database.
        """

        cursor = self.recipes_database.cursor()

        sql = "DELETE FROM Ingredients WHERE RecipeID = %s"
        val = (recipe.id_,)

        cursor.execute(sql, val)
        self.recipes_database.commit()

        for ingredient in recipe.ingredients:
            self._create_ingredient(ingredient, recipe.id_)

        cursor.close()

    def get_user_by_username(self, username: str) -> UserInDB:
        """
        Get a user from the database.

        Raises:
            NotFoundException if the user could not be found.

        Returns:
            The user object.
        """

        cursor = self.recipes_database.cursor()

        sql = "SELECT UserID, Username, Password, IsAdmin, Disabled FROM Users WHERE Username = %s"
        val = (username,)

        cursor.execute(sql, val)
        result = cursor.fetchone()
        if cursor.rowcount == 0:
            cursor.close()
            raise NotFoundException(
                f"User with username {username} not found in database."
            )

        user_id, username, password, is_admin, disabled = result
        cursor.close()
        return UserInDB(
            username=username,
            disabled=disabled,
            id_=user_id,
            is_admin=is_admin,
            hashed_password=password,
        )

    def get_user_by_id(self, user_id: int) -> UserInDB:
        """
        Get a user from the database using the user ID.

        Raises:
            NotFoundException if the user could not be found.

        Returns:
            The user object.
        """

        cursor = self.recipes_database.cursor()

        sql = (
            "SELECT Username, Password, IsAdmin, Disabled FROM Users WHERE UserID = %s"
        )
        val = (user_id,)

        cursor.execute(sql, val)
        result = cursor.fetchone()
        if cursor.rowcount == 0:
            cursor.close()
            raise NotFoundException(f"User with id {user_id} not found in database.")

        username, password, is_admin, disabled = result

        cursor.close()
        return UserInDB(
            username=username,
            disabled=disabled,
            id_=user_id,
            is_admin=is_admin,
            hashed_password=password,
        )

    def create_user(
        self, username: str, password: str, is_admin: bool
    ) -> UserInDB | None:
        cursor = self.recipes_database.cursor()

        sql = "INSERT INTO Users (Username, Password, IsAdmin, Disabled) VALUES (%s, %s, %s, 0)"
        val = (username, password, is_admin)

        try:
            cursor.execute(sql, val)
        except mysql.connector.errors.IntegrityError:
            raise ValueError("User already exists in database.")

        self.recipes_database.commit()

        _ = cursor.fetchone()
        if cursor.rowcount == 0:
            cursor.close()
            return None

        user_id = cursor.lastrowid

        cursor.close()
        return UserInDB(
            username=username,
            disabled=False,
            id_=user_id,
            is_admin=is_admin,
            hashed_password=password,
        )

    def close(self):
        self.recipes_database.close()
