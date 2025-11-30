from sqlalchemy.orm import Session
import json
import random
from typing import List

from .. import crud
from ..config import settings
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

# Initialize the Gemini model with higher temperature for creativity
llm = ChatGoogleGenerativeAI(model="gemini-2.0-flash", google_api_key=settings.GEMINI_API_KEY, temperature=0.8)

def generate_album_suggestions(db: Session) -> List[str]:
    """
    Analyzes all image tags to suggest potential new albums using an AI model.
    """
    # 1. Get the most common tags from the database (fetch more to allow sampling)
    tag_counts = crud.get_tag_counts(db, limit=100)
    if not tag_counts:
        return []

    # Inject Randomness: Sample a subset of tags if possible to vary the context
    # This ensures that hitting "refresh" yields different results
    if len(tag_counts) > 30:
        selected_tags = random.sample(tag_counts, 30)
    else:
        selected_tags = list(tag_counts)
        random.shuffle(selected_tags)

    # Format the tags for the AI prompt
    tags_str = ", ".join([f"{name} ({count} images)" for name, count in selected_tags])

    # 2. Craft a prompt to ask the AI for creative album titles
    prompt_template = ChatPromptTemplate.from_messages([
        ("system", """
        You are a creative photo curator. Your task is to analyze a list of photo tags and their frequencies, then suggest 4-5 creative, high-level album titles.

        INSTRUCTIONS:
        - Do NOT simply repeat the tags. Synthesize them into broader themes.
        - The output must be a JSON object with a single key "suggestions" which is a list of strings.
        - Example: If you see tags like 'beach, sunset, ocean, sand', a good suggestion is "Golden Hour by the Sea".
        - Example: If you see 'city, skyline, buildings, night', a good suggestion is "Urban Nights".
        - Suggest 4 to 5 albums.
        - Be varied and imaginative.

        TAG DATA:
        {tag_data}
        """),
        ("human", "Based on the tag data, what album titles do you suggest?"),
        ("ai", "JSON:")
    ])

    parser = StrOutputParser()
    chain = prompt_template | llm | parser

    try:
        # 3. Call the AI and parse the response
        result = chain.invoke({"tag_data": tags_str})
        cleaned_result = result.strip().replace("```json", "").replace("```", "").strip()
        suggestions_json = json.loads(cleaned_result)
        return suggestions_json.get("suggestions", [])
    except (json.JSONDecodeError, Exception) as e:
        print(f"Error parsing AI suggestion response: {e}")
        return []


def generate_search_suggestions(db: Session) -> List[str]:
    """
    Generates AI-powered search query suggestions based on the user's image collection.
    Returns natural language search queries that users might want to try.
    """
    # Get tag data and location data
    tag_counts = crud.get_tag_counts(db, limit=50)
    locations = crud.get_unique_locations(db)
    
    if not tag_counts and not locations:
        # Return default suggestions if no data
        return [
            "Photos of cats in a sunbeam",
            "Beach sunsets from last summer",
            "Pictures of my car",
            "Best food photos from 2023",
        ]
    
    # Sample tags for variety
    if len(tag_counts) > 20:
        selected_tags = random.sample(tag_counts, 20)
    else:
        selected_tags = list(tag_counts)
        random.shuffle(selected_tags)
    
    # Sample locations
    if locations and len(locations) > 5:
        selected_locations = random.sample(locations, 5)
    else:
        selected_locations = locations[:5] if locations else []
    
    # Format data for AI
    tags_str = ", ".join([f"{name} ({count})" for name, count in selected_tags])
    locations_str = ", ".join(selected_locations) if selected_locations else "No location data"
    
    # Create prompt for search suggestions
    prompt_template = ChatPromptTemplate.from_messages([
        ("system", """
        You are a helpful AI assistant for a photo gallery app. Generate 4-5 natural language search query suggestions based on the user's photo collection.
        
        INSTRUCTIONS:
        - Create search queries that users would naturally type
        - Mix different types: objects, scenes, locations, activities, emotions
        - Make them specific and interesting based on the available tags and locations
        - Output must be a JSON object with key "suggestions" containing a list of strings
        - Each suggestion should be a complete search query (e.g., "sunset photos from the beach")
        
        AVAILABLE TAGS: {tags}
        AVAILABLE LOCATIONS: {locations}
        
        Examples of good suggestions:
        - "Photos of cats playing in the garden"
        - "Sunset pictures from California"
        - "Food photography from restaurants"
        - "Mountain landscapes with snow"
        """),
        ("human", "Generate search suggestions based on my photo collection."),
        ("ai", "JSON:")
    ])
    
    parser = StrOutputParser()
    chain = prompt_template | llm | parser
    
    try:
        result = chain.invoke({"tags": tags_str, "locations": locations_str})
        cleaned_result = result.strip().replace("```json", "").replace("```", "").strip()
        suggestions_json = json.loads(cleaned_result)
        return suggestions_json.get("suggestions", [])
    except (json.JSONDecodeError, Exception) as e:
        print(f"Error generating search suggestions: {e}")
        # Return fallback suggestions
        return [
            "Photos of cats in a sunbeam",
            "Beach sunsets from last summer",
            "Pictures of my car",
            "Best food photos from 2023",
        ]
