from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..services import ai_suggestions

router = APIRouter(
    prefix="/api/v1/suggestions",
    tags=["suggestions"],
)

@router.get("/albums", response_model=List[str])
def get_album_suggestions(db: Session = Depends(get_db)):
    """
    Generate and return a list of AI-powered album suggestions.
    """
    return ai_suggestions.generate_album_suggestions(db=db)
