from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..services import ai_suggestions

router = APIRouter(
    prefix="/api/v1/assist",
    tags=["assist"],
)

@router.get("/albums", response_model=List[str])
def get_album_suggestions(db: Session = Depends(get_db)):
    """
    Generate and return a list of AI-powered album suggestions.
    """
    return ai_suggestions.generate_album_suggestions(db=db)

@router.get("/search-terms", response_model=List[str])
def get_search_suggestions(db: Session = Depends(get_db)):
    """
    Generate and return a list of AI-powered search query suggestions
    based on the user's photo collection.
    """
    return ai_suggestions.generate_search_suggestions(db=db)
