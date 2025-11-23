from sqlalchemy.orm import Session
import json
from typing import List

from .. import crud
from ..config import settings
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

# Initialize the Gemini model
llm = ChatGoogleGenerativeAI(model="gemini-2.0-flash", google_api_key=settings.GEMINI_API_KEY)

def generate_album_suggestions(db: Session) -> List[str]:
    """

    Analyzes all image tags to suggest potential new albums using an AI model.
    """
    # 1. Get the most common tags from the database
    tag_counts = crud.get_tag_counts(db, limit=25)
    if not tag_counts:
        return []

    # Format the tags for the AI prompt
    tags_str = ", ".join([f"{name} ({count} images)" for name, count in tag_counts])

    # 2. Craft a prompt to ask the AI for creative album titles
    prompt_template = ChatPromptTemplate.from_messages([
        ("system", """
        You are a creative photo curator. Your task is to analyze a list of photo tags and their frequencies, then suggest 2-3 creative, high-level album titles.

        INSTRUCTIONS:
        - Do NOT simply repeat the tags. Synthesize them into broader themes.
        - The output must be a JSON object with a single key "suggestions" which is a list of strings.
        - Example: If you see tags like 'beach, sunset, ocean, sand', a good suggestion is "Golden Hour by the Sea".
        - Example: If you see 'city, skyline, buildings, night', a good suggestion is "Urban Nights".
        - Do not suggest more than 3 albums.

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
        result = chain.invoke({{"tag_data": tags_str}})
        cleaned_result = result.strip().replace("`json", "").replace("`", "")
        suggestions_json = json.loads(cleaned_result)
        return suggestions_json.get("suggestions", [])
    except (json.JSONDecodeError, Exception) as e:
        print(f"Error parsing AI suggestion response: {e}")
        return []

