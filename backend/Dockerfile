FROM python:3.13-slim

COPY . .

RUN pip install -r requirements.txt

ENTRYPOINT [ "uvicorn", "app:app", "--port", "5000", "--host", "0.0.0.0" ]
