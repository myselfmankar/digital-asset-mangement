# Use a lightweight Python image
FROM python:3.10-slim-bookworm

# Set the working directory inside the container
WORKDIR /app

COPY . .

EXPOSE 8000

CMD ["python", "-m", "http.server", "8000"]