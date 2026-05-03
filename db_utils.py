from sqlmodel import create_engine, Session
from typing import Annotated
from fastapi import Depends, HTTPException
from dotenv import load_dotenv
import os
import logging

logger = logging.getLogger(__name__)
load_dotenv()
db_name = os.getenv("DB_USERNAME")
password = os.getenv("DB_PASSWORD")
if not db_name or not password:
    logger.error(f"db credentials couldn't load from .env")
    raise ValueError("db credentials couldn't load from .env")
DATABASE_URL = f"mysql+pymysql://{db_name}:{password}@localhost:3306/blog"
engine = create_engine(DATABASE_URL)


def get_session():
    try:
        with Session(engine) as db:
            yield db
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Database error: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error.")


Session_dep = Annotated[Session, Depends(get_session)]
