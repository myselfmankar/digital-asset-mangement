from sqlalchemy.orm import Session
from datetime import datetime

from .. import crud
from ..config import settings
from ..schemas import SearchQuery
from langchain_google_genai import ChatGoogleGenerativeAI

def perform_ai_search(db: Session, query: str):
    """
    Performs the two-tiered AI search.
    1. Attempts a structured data extraction.
    2. Falls back to a keyword search if the first attempt fails or yields no results.
    """
    # Tier 1: Structured Data Extraction
    search_query_model = _get_structured_query_from_ai(query)

    if search_query_model and any(search_query_model.model_dump().values()):
        # If the AI returns any filters, perform a precise search
        images = crud.search_images_by_filters(db, filters=search_query_model)
        if images:
            return images

    # Tier 2: Keyword Search Fallback (if structured search returns nothing)
    return crud.search_images_by_keywords(db, query=query)

def _get_structured_query_from_ai(query: str) -> SearchQuery | None:
    """
    Sends the user query to the AI and forces a structured Pydantic output.
    """
    # Initialize the Gemini model with structured output capabilities
    llm = ChatGoogleGenerativeAI(model="gemini-2.0-flash", google_api_key=settings.GEMINI_API_KEY)
    structured_llm = llm.with_structured_output(SearchQuery)

    # Contextual prompt to guide the AI
    prompt = f"""
    You are an expert search assistant for a photo gallery. Your task is to extract search parameters from the user's query and format them into the required tool schema.

    CONTEXT:
    - Today's date is {datetime.now().strftime('%Y-%m-%d')}.
    - The user's location is India. In India, summer is from March to June.
    
    INSTRUCTIONS:
    - For date queries, convert relative terms (like 'last week', 'in 2023', 'last summer') into a specific 'YYYY-MM-DD' format or a 'YYYY-MM-DD to YYYY-MM-DD' range.
    - If you cannot extract any information for a field, omit it.
    - If you cannot extract any relevant information that fits the schema at all, return an empty object.

    USER QUERY:
    "{query}"
    """

    try:
        # The AI's output will be a Pydantic object of type SearchQuery
        search_query_model = structured_llm.invoke(prompt)
        return search_query_model
    except Exception as e:
        print(f"Error invoking structured output from AI: {e}")
        return None