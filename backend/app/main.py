import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.api.v1.router import api_router
from app.db.session import engine, Base
import app.models  # ensure models are imported

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("leadflow")


@asynccontextmanager
async def lifespan(app: FastAPI):
    if not os.getenv("TESTING"):
        try:
            Base.metadata.create_all(bind=engine)
            logger.info("Database schema verified.")
        except Exception as e:
            logger.warning(f"Database connection deferred or failed: {e}")
    yield
    logger.info("LeadFlow CRM backend shutdown.")


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Production-grade Lead Management CRM for PravarAI Assessment",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Middleware
origins = settings.cors_origin_list
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception at {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An internal server error occurred. Please contact support."},
    )


app.include_router(api_router, prefix=settings.API_V1_PREFIX)


@app.get("/", include_in_schema=False)
def root():
    return {
        "message": "Welcome to LeadFlow CRM API",
        "docs": "/docs",
        "health": f"{settings.API_V1_PREFIX}/health",
    }
