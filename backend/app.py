import json

import mysql.connector
from fastapi import FastAPI

app = FastAPI()


def load_config():
    with open("assets/config.json", encoding="utf-8") as f:
        return json.load(f)


def load_credentials():
    with open("assets/creds.json", encoding="utf-8") as f:
        return json.load(f)


CONFIG = load_config()
CREDENTIALS = load_credentials()

mydb = mysql.connector.connect(
    host=CONFIG["database_ip"],
    port=int(CONFIG["database_port"]),
    user=CREDENTIALS["database_user"],
    password=CREDENTIALS["database_password"],
    database=CREDENTIALS["database_name"],
)

print(mydb.get_server_version())
