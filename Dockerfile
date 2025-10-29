FROM python:3.10-slim-bookworm

WORKDIR /app

# Install uv
RUN pip install uv

# Copy requirements and install using uv
COPY requirements.txt .
RUN uv pip install --no-cache-dir -r requirements.txt --system

COPY . .

EXPOSE 8000

CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000"]