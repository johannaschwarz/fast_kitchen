import asyncio
from abc import ABC, abstractmethod
from enum import StrEnum

import aiomysql
from exceptions import NotFoundException
from models.recipe import (
    Ingredient,
    Recipe,
    RecipeBase,
    RecipeListing,
    RecipeStep,
    UnitEnum,
)
from models.user import UserInDB
from pydantic import ValidationError
from utils import load_config, load_credentials, run_background_task


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
    async def create_recipe(self, recipe: RecipeBase, user: UserInDB):
        """
        Create a new recipe in the database.

        Returns:
            The ID of the new recipe.
        """

    @abstractmethod
    async def get_recipe(self, recipe_id: int) -> Recipe:
        """
        Get a recipe from the database.

        Raises:
            NotFoundException if the recipe could not be found.
            ValidationError if the object could not be validated.

        Returns:
            The recipe object.
        """

    @abstractmethod
    async def get_all_recipes(
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
    async def update_recipe(self, recipe: Recipe):
        """
        Update a recipe in the database.

        Returns:
            True if the recipe was updated, False otherwise.
        """

    @abstractmethod
    async def delete_recipe(self, recipe_id: int):
        """
        Delete a recipe from the database.

        Returns:
            True if the recipe was deleted, False otherwise.
        """

    @abstractmethod
    async def is_authorized(self, user_id: int, recipe_id: int) -> bool:
        """Check if the user is authorized to access the recipe."""

    @abstractmethod
    async def create_image(self, image: bytes) -> int:
        """
        Create a new image in the database.

        Returns:
            The ID of the new image.
        """

    @abstractmethod
    async def get_image(self, image_id: int) -> bytes:
        """
        Get an image from the database.

        Raises:
            NotFoundException if the image could not be found.
            ValidationError if the image could not be validated.

        Returns:
            The image object.
        """

    @abstractmethod
    async def delete_image(self, image_id: int):
        """
        Delete an image from the database.

        Raises:
            NotFoundException if the image could not be found.
        """

    @abstractmethod
    async def get_categories(self) -> list[str]:
        """
        Get all categories from the database.

        Returns:
            A list of categories.
        """

    @abstractmethod
    async def get_user_by_username(self, username: str) -> UserInDB:
        """
        Get a user from the database using the username.

        Raises:
            NotFoundException if the user could not be found.

        Returns:
            The user object.
        """

    @abstractmethod
    async def get_user_by_id(self, user_id: int | None) -> UserInDB | None:
        """
        Get a user from the database using the user ID.

        Raises:
            NotFoundException if the user could not be found.

        Returns:
            The user object.
        """

    @abstractmethod
    async def create_user(
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

    def __init__(self, mysql_pool):
        self.pool = mysql_pool

    @staticmethod
    async def create():
        pool = await aiomysql.create_pool(
            maxsize=20,
            host=MySQLDatabase.CONFIG["database_ip"],
            port=int(MySQLDatabase.CONFIG["database_port"]),
            user=MySQLDatabase.CREDENTIALS["database_user"],
            password=MySQLDatabase.CREDENTIALS["database_password"],
            db=MySQLDatabase.CREDENTIALS["database_name"],
            autocommit=True,
        )
        return MySQLDatabase(pool)

    async def _run_query(self, query, values=None):
        async with self.pool.acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute(query, values)

                rows = await cur.fetchall()
                return rows

    async def create_recipe(self, recipe: RecipeBase, user: UserInDB) -> int:
        """
        Create a new recipe in the database.

        Returns:
            The ID of the new recipe.
        """
        async with self.pool.acquire() as conn:
            async with conn.cursor() as cursor:
                sql = "INSERT INTO Recipes (Title, Description, CookingTime, CoverImage, Portions, UserID) VALUES (%s, %s, %s, %s, %s, %s)"
                val = (
                    recipe.title,
                    recipe.description,
                    recipe.cooking_time,
                    recipe.cover_image
                    if recipe.cover_image and recipe.cover_image > 0
                    else None,
                    recipe.portions,
                    user.id_,
                )
                await cursor.execute(sql, val)

                id_ = cursor.lastrowid

        queries = [
            asyncio.gather(
                *(self.create_category(category, id_) for category in recipe.categories)
            ),
            asyncio.gather(
                *(
                    self._create_ingredient(ingredient, id_)
                    for ingredient in recipe.ingredients
                )
            ),
            asyncio.gather(
                *(self._create_recipe_step(step, id_) for step in recipe.steps)
            ),
        ]

        if recipe.gallery_images:
            queries.append(
                asyncio.gather(
                    *(
                        self._add_recipe_to_image(id_, image_id)
                        for image_id in recipe.gallery_images
                    )
                )
            )

        await asyncio.gather(*queries)

        return id_

    async def get_recipe(self, recipe_id: int) -> Recipe:
        """
        Get a recipe from the database.

        Raises:
            NotFoundException: if the recipe could not be found.
            ValidationError: if the object could not be validated.

        Returns:
            The recipe object.
        """
        run_background_task(self._increase_clicks_for_recipe(recipe_id))

        recipe, categories, ingredients, images, steps = await asyncio.gather(
            self._run_query(
                "SELECT r.RecipeID, r.Title, r.Description, r.CookingTime, r.CoverImage, r.Portions, u.Username, u.UserID, r.Clicks FROM Recipes r, Users u WHERE r.RecipeID = %s AND r.UserID = u.UserID",
                (recipe_id,),
            ),
            self.get_categories_by_recipe(recipe_id),
            self._get_ingredients_by_recipe(recipe_id),
            self._get_gallery_images_by_recipe(recipe_id),
            self._get_recipe_steps_by_recipe(recipe_id),
        )

        if not recipe:
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
            user_name,
            user_id,
            clicks,
        ) = recipe[0]

        return Recipe(
            id_=id_,
            title=title,
            creator_name=user_name,
            creator_id=user_id,
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

    async def _increase_clicks_for_recipe(self, recipe_id: int):
        """
        Increase the number of clicks for a recipe in the database.
        """
        await self._run_query(
            "UPDATE Recipes SET Clicks = Clicks + 1 WHERE RecipeID = %s", (recipe_id,)
        )

    async def get_all_recipes(
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

        async with self.pool.acquire() as conn:
            async with conn.cursor() as cursor:
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
                    await cursor.execute(
                        f"SELECT DISTINCT r.RecipeID, r.Title, r.Description, r.CoverImage, r.UserID, r.Clicks, r.CookingTime FROM Recipes r, Categories c WHERE (r.Title LIKE CONCAT('%%', %s, '%%') OR r.Description LIKE CONCAT('%%', %s, '%%')) AND c.RecipeID = r.RecipeID AND c.Category IN ({', '.join(['%s'] * len(filter_categories))}) GROUP BY r.RecipeID HAVING COUNT(c.Category) = %s ORDER BY {sort_by} {sort_order} {limitation_query};",
                        (
                            search_string,
                            search_string,
                            *filter_categories,
                            len(filter_categories),
                        )
                        + limit_parameters,
                    )
                else:
                    await cursor.execute(
                        f"SELECT RecipeID, Title, Description, CoverImage, UserID, Clicks, CookingTime FROM Recipes WHERE Title LIKE CONCAT('%%', %s, '%%') OR Description LIKE CONCAT('%%', %s, '%%') ORDER BY {sort_by} {sort_order} {limitation_query}",
                        (search_string, search_string) + limit_parameters,
                    )
                result = await cursor.fetchall()
        recipes = []
        recipe_categories, creators = await asyncio.gather(
            asyncio.gather(*(self.get_categories_by_recipe(r[0]) for r in result)),
            asyncio.gather(*(self.get_user_by_id(r[4]) for r in result)),
        )
        for (
            (
                id_,
                title,
                description,
                image,
                user_id,
                clicks,
                cooking_time,
            ),
            categories,
            creator,
        ) in zip(result, recipe_categories, creators):
            # if not image:
            #     images = await self._get_gallery_images_by_recipe(id_)
            #     image = images[0] if images else None
            try:
                recipes.append(
                    RecipeListing(
                        id_=id_,
                        title=title if title else "",
                        description=description if description else "",
                        cover_image=image,
                        categories=categories,
                        creator=(creator.username if user_id else None),
                        clicks=clicks,
                        cooking_time=cooking_time,
                    )
                )
            except ValidationError:
                print(f"Recipe with id {id_} could not be validated.")
                continue

        return recipes

    async def get_recipes_by_category(self, category: str) -> list[int]:
        """
        Get all recipes by category from the database.

        Returns:
            A list of recipe IDs.
        """
        async with self.pool.acquire() as conn:
            async with conn.cursor() as cursor:
                sql = "SELECT RecipeID FROM Categories WHERE Category = %s"
                val = (category,)
                await cursor.execute(sql, val)
                result = await cursor.fetchall()
        return [recipe_id for (recipe_id,) in result]

    async def update_recipe(self, recipe: Recipe):
        """
        Update a recipe in the database.

        Raises:
            UpdateFailedException: if the recipe could not be updated.
        """
        async with self.pool.acquire() as conn:
            async with conn.cursor() as cursor:
                sql = "UPDATE Recipes SET Title = %s, Description = %s, CookingTime = %s, CoverImage = %s, Portions = %s WHERE RecipeID = %s"
                val = (
                    recipe.title,
                    recipe.description,
                    recipe.cooking_time,
                    recipe.cover_image
                    if recipe.cover_image and recipe.cover_image > 0
                    else None,
                    recipe.portions,
                    recipe.id_,
                )
                await cursor.execute(sql, val)

        await self._update_categories_by_recipe(recipe)
        await self._update_ingredients_by_recipe(recipe)
        await self._update_images_by_recipe(recipe)
        await self._update_recipe_steps_by_recipe(recipe)

    async def delete_recipe(self, recipe_id: int) -> bool:
        """
        Delete a recipe from the database.

        Returns:
            True if the recipe was deleted, False otherwise.
        """
        async with self.pool.acquire() as conn:
            async with conn.cursor() as cursor:
                sql = "DELETE FROM Recipes WHERE RecipeID = %s"
                val = (recipe_id,)
                await cursor.execute(sql, val)

                if cursor.rowcount == 0:
                    raise NotFoundException(
                        f"Recipe with id {recipe_id} not found in database."
                    )

    async def is_authorized(self, user_id: int, recipe_id: int) -> bool:
        """Check if the user is authorized to access the recipe."""
        async with self.pool.acquire() as conn:
            async with conn.cursor() as cursor:
                sql = "SELECT IsAdmin, Disabled FROM Users WHERE UserID = %s"
                val = (user_id,)
                await cursor.execute(sql, val)
                result = await cursor.fetchone()
                is_admin, disabled = result
                if disabled:
                    return False
                if is_admin:
                    return True
            async with conn.cursor() as cursor:
                sql = "SELECT UserId FROM Recipes WHERE RecipeID = %s"
                val = (recipe_id,)
                await cursor.execute(sql, val)
                result = await cursor.fetchone()
                return result[0] == user_id

    async def _create_recipe_step(self, recipe_step: RecipeStep, recipe_id: int):
        """
        Create a new recipe step in the database.

        Returns:
            The ID of the new recipe step.
        """
        async with self.pool.acquire() as conn:
            async with conn.cursor() as cursor:
                sql = "INSERT INTO RecipeSteps (RecipeID, OrderID, Step) VALUES (%s, %s, %s)"
                val = (recipe_id, recipe_step.order_id, recipe_step.step)
                await cursor.execute(sql, val)

                id_ = cursor.lastrowid
        if not recipe_step.images:
            return
        for image_id in recipe_step.images:
            await self._add_recipe_step_to_image(id_, image_id)

    async def _get_recipe_steps_by_recipe(self, recipe_id: int) -> list[RecipeStep]:
        """
        Get all recipe steps for a recipe from the database.

        Returns:
            A list of recipe steps.
        """
        async with self.pool.acquire() as conn:
            async with conn.cursor() as cursor:
                sql = (
                    "SELECT StepID, OrderID, Step FROM RecipeSteps WHERE RecipeID = %s"
                )
                val = (recipe_id,)
                await cursor.execute(sql, val)
                result = await cursor.fetchall()
        steps = []
        for step_id, order_id, step in result:
            images = await self._get_images_by_recipe_step(step_id)
            steps.append(RecipeStep(order_id=order_id, step=step, images=images))
        return steps

    async def _update_recipe_steps_by_recipe(self, recipe: Recipe):
        """Update the steps for a recipe in the database."""
        async with self.pool.acquire() as conn:
            async with conn.cursor() as cursor:
                sql = "Delete FROM RecipeSteps WHERE RecipeID = %s"
                val = (recipe.id_,)
                await cursor.execute(sql, val)

        for step in recipe.steps:
            await self._create_recipe_step(step, recipe.id_)

    async def create_image(self, image: bytes) -> int:
        """
        Create a new image in the database.

        Returns:
            The ID of the new image.
        """
        async with self.pool.acquire() as conn:
            async with conn.cursor() as cursor:
                sql = "INSERT INTO Images (Image) VALUES (%s)"
                val = (image,)
                await cursor.execute(sql, val)

                id_ = cursor.lastrowid
        return id_

    async def get_image(self, image_id: int) -> bytes:
        """
        Get an image from the database.

        Raises:
            NotFoundException: if the image could not be found.
            ValidationError: if the image could not be validated.

        Returns:
            The image object.
        """
        async with self.pool.acquire() as conn:
            async with conn.cursor() as cursor:
                sql = "SELECT Image FROM Images WHERE ImageID = %s"
                val = (image_id,)
                await cursor.execute(sql, val)
                result = await cursor.fetchone()
                if cursor.rowcount == 0:
                    raise NotFoundException(
                        f"Image with id {image_id} not found in database."
                    )
        return result[0]

    async def delete_image(self, image_id: int):
        """
        Delete an image from the database.

        Raises:
            NotFoundException: if the image could not be found.
        """
        await self._run_query("DELETE FROM Images WHERE ImageID = %s", (image_id,))

    async def _get_gallery_images_by_recipe(self, recipe_id: int) -> list[int]:
        """
        Get all gallery images for a recipe from the database.

        Returns:
            A list of images.
        """
        sql = "SELECT i.ImageID FROM Images i, Recipes r WHERE i.RecipeID = %s AND r.RecipeID = i.RecipeID AND i.StepID IS NULL AND i.ImageID != r.CoverImage"
        result = await self._run_query(sql, (recipe_id,))
        return [image_id for (image_id,) in result]

    async def _update_images_by_recipe(self, recipe: Recipe):
        """
        Update the images for a recipe in the database.
        """
        async with self.pool.acquire() as conn:
            async with conn.cursor() as cursor:
                sql = "SELECT ImageID FROM Images WHERE RecipeID = %s"
                val = (recipe.id_,)
                await cursor.execute(sql, val)
                current_images = [image_id for (image_id,) in await cursor.fetchall()]
        recipe_images = set(recipe.gallery_images) | {recipe.cover_image}
        deleted_images = [
            image_id for image_id in current_images if image_id not in recipe_images
        ]
        added_images = [
            image_id for image_id in recipe_images if image_id not in current_images
        ]
        for image_id in deleted_images:
            await self._delete_image(image_id)
        for image_id in added_images:
            await self._add_recipe_to_image(recipe.id_, image_id)

    async def _add_recipe_to_image(self, recipe_id: int, image_id: int):
        """
        Add a recipe to an image in the database.
        """
        async with self.pool.acquire() as conn:
            async with conn.cursor() as cursor:
                sql = "UPDATE Images SET RecipeID = %s WHERE ImageID = %s"
                val = (recipe_id, image_id)
                await cursor.execute(sql, val)

    async def _add_recipe_step_to_image(self, step_id: int, image_id: int):
        """
        Add a recipe step to an image in the database.
        """
        async with self.pool.acquire() as conn:
            async with conn.cursor() as cursor:
                sql = "UPDATE Images SET StepID = %s WHERE ImageID = %s"
                val = (step_id, image_id)
                await cursor.execute(sql, val)

    async def _get_images_by_recipe_step(self, step_id: int) -> list[int]:
        """
        Get all images for a recipe step from the database.

        Returns:
            A list of images.
        """
        async with self.pool.acquire() as conn:
            async with conn.cursor() as cursor:
                sql = "SELECT ImageID FROM Images WHERE StepID = %s"
                val = (step_id,)
                await cursor.execute(sql, val)
                result = await cursor.fetchall()
        return [image_id for (image_id,) in result]

    async def _delete_image(self, image_id: int):
        """
        Delete an image from the database.

        Raises:
            NotFoundException: if the image could not be found.
        """
        async with self.pool.acquire() as conn:
            async with conn.cursor() as cursor:
                sql = "DELETE FROM Images WHERE ImageID = %s"
                val = (image_id,)
                await cursor.execute(sql, val)

                if cursor.rowcount == 0:
                    raise NotFoundException(
                        f"Image with id {image_id} not found in database."
                    )

    async def delete_unused_images(self):
        """
        Delete all images that are not used in any recipe.
        """
        async with self.pool.acquire() as conn:
            async with conn.cursor() as cursor:
                sql = "DELETE FROM Images WHERE RecipeID IS NULL AND TimeStamp < DATE_SUB(NOW(), INTERVAL 1 DAY)"
                await cursor.execute(sql)

    async def create_category(self, category: str, recipe_id: int):
        """
        Create a new category in the database.
        """
        async with self.pool.acquire() as conn:
            async with conn.cursor() as cursor:
                sql = "INSERT INTO Categories (RecipeID, Category) VALUES (%s, %s)"
                val = (recipe_id, category)
                await cursor.execute(sql, val)

    async def get_categories_by_recipe(self, recipe_id: int) -> list[str]:
        """
        Get all categories for a recipe from the database.

        Returns:
            A list of categories.
        """
        result = await self._run_query(
            "SELECT Category FROM Categories WHERE RecipeID = %s", (recipe_id,)
        )
        return [category for (category,) in result]

    async def _update_categories_by_recipe(self, recipe: Recipe):
        """
        Update the categories for a recipe in the database.
        """
        async with self.pool.acquire() as conn:
            async with conn.cursor() as cursor:
                sql = "DELETE FROM Categories WHERE RecipeID = %s"
                val = (recipe.id_,)
                await cursor.execute(sql, val)

        for category in recipe.categories:
            await self.create_category(category, recipe.id_)

    async def delete_category(self, category: str, recipe_id: int):
        """
        Delete a category from the database.
        """
        await self._run_query(
            "DELETE FROM Categories WHERE RecipeID = %s AND Category = %s",
            (recipe_id, category),
        )

    async def get_categories(self) -> list[str]:
        """
        Get all categories from the database.

        Returns:
            A list of categories.
        """
        return [
            category
            for (category,) in await self._run_query(
                "SELECT DISTINCT Category FROM Categories"
            )
        ]

    async def _create_ingredient(self, ingredient: Ingredient, recipe_id: int):
        """
        Create a new ingredient in the database.
        """
        sql = "INSERT INTO Ingredients (RecipeID, Ingredient, Unit, Amount, IngredientGroup) VALUES (%s, %s, %s, %s, %s)"
        val = (
            recipe_id,
            ingredient.name,
            str(ingredient.unit),
            ingredient.amount,
            ingredient.group,
        )
        await self._run_query(sql, val)

    async def _get_ingredients_by_recipe(self, recipe_id: int) -> list[Ingredient]:
        """
        Get all ingredients for a recipe from the database.

        Returns:
            A list of ingredients.
        """
        result = await self._run_query(
            "SELECT Ingredient, Unit, Amount, IngredientGroup FROM Ingredients WHERE RecipeID = %s",
            (recipe_id,),
        )
        return [
            Ingredient(name=ingredient, unit=UnitEnum(unit), amount=amount, group=group)
            for ingredient, unit, amount, group in result
        ]

    async def _update_ingredients_by_recipe(self, recipe: Recipe):
        """
        Update the ingredients for a recipe in the database.
        """
        async with self.pool.acquire() as conn:
            async with conn.cursor() as cursor:
                sql = "DELETE FROM Ingredients WHERE RecipeID = %s"
                val = (recipe.id_,)
                await cursor.execute(sql, val)

        for ingredient in recipe.ingredients:
            await self._create_ingredient(ingredient, recipe.id_)

    async def get_user_by_username(self, username: str) -> UserInDB:
        """
        Get a user from the database.

        Raises:
            NotFoundException if the user could not be found.

        Returns:
            The user object.
        """
        async with self.pool.acquire() as conn:
            async with conn.cursor() as cursor:
                sql = "SELECT UserID, Username, Password, IsAdmin, Disabled FROM Users WHERE Username = %s"
                val = (username,)
                await cursor.execute(sql, val)
                result = await cursor.fetchone()
                if cursor.rowcount == 0:
                    raise NotFoundException(
                        f"User with username {username} not found in database."
                    )
                user_id, username, password, is_admin, disabled = result
        return UserInDB(
            username=username,
            disabled=disabled,
            id_=user_id,
            is_admin=is_admin,
            hashed_password=password,
        )

    async def get_user_by_id(self, user_id: int | None) -> UserInDB:
        """
        Get a user from the database using the user ID.

        Raises:
            NotFoundException if the user could not be found.

        Returns:
            The user object.
        """
        if user_id is None:
            return None
        sql = (
            "SELECT Username, Password, IsAdmin, Disabled FROM Users WHERE UserID = %s"
        )
        val = (user_id,)
        result = await self._run_query(sql, val)
        if len(result) == 0:
            raise NotFoundException(f"User with id {user_id} not found in database.")
        username, password, is_admin, disabled = result[0]
        return UserInDB(
            username=username,
            disabled=disabled,
            id_=user_id,
            is_admin=is_admin,
            hashed_password=password,
        )

    async def create_user(
        self, username: str, password: str, is_admin: bool
    ) -> UserInDB | None:
        async with self.pool.acquire() as conn:
            async with conn.cursor() as cursor:
                sql = "INSERT INTO Users (Username, Password, IsAdmin, Disabled) VALUES (%s, %s, %s, 0)"
                val = (username, password, is_admin)
                try:
                    await cursor.execute(sql, val)
                except Exception as e:
                    # aiomysql does not expose mysql.connector.errors.IntegrityError, so catch all and check message
                    if "Duplicate entry" in str(e):
                        raise ValueError("User already exists in database.")
                    raise

                if cursor.rowcount == 0:
                    return None
                user_id = cursor.lastrowid
        return UserInDB(
            username=username,
            disabled=False,
            id_=user_id,
            is_admin=is_admin,
            hashed_password=password,
        )

    async def close(self):
        self.pool.close()
        await self.pool.wait_closed()
