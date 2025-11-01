FROM python:3.10-slim-bookworm

WORKDIR /app

# Set environment
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Install dependencies
COPY requirements.txt ./
RUN pip install uv
RUN uv pip install --no-cache-dir -r requirements.txt --system

# Copy project
COPY . .

# Ensure folders for uploads and thumbnails
RUN mkdir -p /app/uploads /app/uploads/thumbnails && \
    chmod -R 755 /app/uploads

EXPOSE 8000

# Use uvicorn to run the FastAPI app. Remove --reload in production.
CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
