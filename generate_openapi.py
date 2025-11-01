import json
import yaml
from api.main import app

def generate_openapi_spec():
    """
    Generates the OpenAPI specification from the FastAPI app and saves it
    to openapi.yaml.
    """
    print("Generating OpenAPI specification...")
    openapi_data = app.openapi()
    
    # Optional: Remove the default validation error schema for a cleaner spec
    openapi_data["components"]["schemas"].pop("HTTPValidationError", None)
    openapi_data["components"]["schemas"].pop("ValidationError", None)

    try:
        with open('openapi.yaml', 'w') as f:
            yaml.dump(openapi_data, f, sort_keys=False)
        print("Successfully generated and saved openapi.yaml")
    except Exception as e:
        print(f"Error saving OpenAPI spec: {e}")

if __name__ == "__main__":
    generate_openapi_spec()
