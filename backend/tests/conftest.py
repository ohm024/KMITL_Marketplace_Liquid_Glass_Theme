from pathlib import Path
import sys
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from app.database import Base, get_db  # noqa: E402
from app.main import app  # noqa: E402


@pytest.fixture
def client():
    engine = create_engine('sqlite://', connect_args={'check_same_thread': False},
                           poolclass=StaticPool)
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine, expire_on_commit=False)

    def override():
        with Session() as db:
            yield db

    app.dependency_overrides[get_db] = override
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
    engine.dispose()


def login(client, email):
    r = client.post('/auth/request-otp', json={'email': email}, headers={'Origin': 'http://localhost:3000'})
    assert r.status_code == 200, r.text
    otp = r.json()['dev_otp']
    r = client.post('/auth/verify-otp', json={'email': email, 'otp': otp}, headers={'Origin': 'http://localhost:3000'})
    assert r.status_code == 200, r.text
    return client.cookies.get('kmitl_session')


def add_item(client, title='หนังสือเรียน Python'):
    return client.post('/listings', json={'title': title, 'description': 'สภาพดีมากแทบไม่ได้ใช้',
        'price': 250, 'category': 'หนังสือ/ชีทเรียน', 'condition': 'used',
        'condition_percent': 90, 'pickup_location': 'ECC'},
        headers={'Origin': 'http://localhost:3000'})
