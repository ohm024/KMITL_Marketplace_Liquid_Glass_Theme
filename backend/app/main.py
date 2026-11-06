from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI, HTTPException, Request, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text
from .config import get_settings
from .database import Base, SessionLocal, engine
from .models import User
from .realtime import manager
from .routers import auth, community, listings, users
from .security import decode_session

settings = get_settings()
allowed_origins = list(set(settings.origins + [settings.api_public_url.rstrip('/')]))


@asynccontextmanager
async def lifespan(app: FastAPI):
    if settings.is_production:
        if len(settings.secret_key) < 32 or 'dev-' in settings.secret_key or 'replace-' in settings.secret_key:
            raise RuntimeError('Production SECRET_KEY must be a strong random secret')
        if not settings.smtp_host:
            raise RuntimeError('Production requires SMTP settings')
        if settings.database_url.startswith('sqlite'):
            raise RuntimeError('Production requires PostgreSQL')
    # MVP only. Replace create_all with Alembic migrations before production release.
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title='KMITL Marketplace API', version='0.1.0', lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=allowed_origins,
                   allow_credentials=True, allow_methods=['GET', 'POST', 'PATCH', 'DELETE'],
                   allow_headers=['Content-Type'])


@app.middleware('http')
async def origin_check(request: Request, call_next):
    # Cookie authentication + unsafe methods: reject cross-site writes (CSRF).
    if request.method in ('POST', 'PATCH', 'DELETE', 'PUT') and request.cookies.get('kmitl_session'):
        origin = request.headers.get('origin')
        if origin not in allowed_origins:
            return JSONResponse({'detail': 'Invalid request origin'}, status_code=403)
    return await call_next(request)


@app.get('/health', tags=['Operations'])
def health():
    try:
        with SessionLocal() as db:
            db.execute(text('SELECT 1'))
        return {'status': 'ok'}
    except Exception as exc:
        raise HTTPException(503, 'database unavailable') from exc


app.include_router(auth.router)
app.include_router(users.router)
app.include_router(listings.router)
app.include_router(community.router)

upload_path = Path(__file__).resolve().parent.parent / 'uploads'
upload_path.mkdir(parents=True, exist_ok=True)
app.mount('/uploads', StaticFiles(directory=str(upload_path)), name='uploads')


@app.websocket('/ws')
async def websocket_endpoint(ws: WebSocket):
    if ws.headers.get('origin') not in allowed_origins:
        await ws.close(code=1008)
        return
    token = ws.cookies.get('kmitl_session')
    uid = decode_session(token) if token else None
    if uid is None:
        await ws.close(code=1008)
        return
    with SessionLocal() as db:
        user = db.get(User, uid)
        if not user or user.is_banned:
            await ws.close(code=1008)
            return
    await manager.connect(uid, ws)
    try:
        while True:
            await ws.receive_text()  # push events only; client writes via authenticated REST
    except WebSocketDisconnect:
        manager.disconnect(uid, ws)
