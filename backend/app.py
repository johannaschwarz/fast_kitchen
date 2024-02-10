import image_router
import mysql.connector
import recipe_router
from fastapi import FastAPI
from utils import load_config, load_credentials

app = FastAPI(title="FastKitchen")
CONFIG = load_config()
CREDENTIALS = load_credentials()

app.include_router(recipe_router.recipe_router)
app.include_router(image_router.image_router)

recipes_database = mysql.connector.connect(
    host=CONFIG["database_ip"],
    port=int(CONFIG["database_port"]),
    user=CREDENTIALS["database_user"],
    password=CREDENTIALS["database_password"],
    database=CREDENTIALS["database_name"],
)

print(recipes_database.get_server_version())
