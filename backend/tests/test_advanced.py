import io
from PIL import Image
from fastapi import HTTPException
from app.config import get_settings
from app.listing_service import ListingService
from .conftest import add_item, login

ORIGIN = {'Origin': 'http://localhost:3000'}


class FakeRepository:
    def __init__(self, item=None):
        self.item = item

    def find(self, listing_id: int, *, lock=False):
        return self.item


class SampleListing:
    seller_id = 12
    status = 'available'


def test_service_accepts_fake_repository():
    service = ListingService(FakeRepository(SampleListing()))
    assert service.owner_listing(7, 12).seller_id == 12
    try:
        service.owner_listing(7, 99)
        assert False, 'expected HTTPException'
    except HTTPException as exc:
        assert exc.status_code == 403


def test_admin_permissions(client, monkeypatch):
    settings = get_settings()
    monkeypatch.setattr(settings, 'admin_emails', 'teacher@kmitl.ac.th')
    login(client, 'member@kmitl.ac.th')
    unauthorized = client.get('/admin/reports')
    assert unauthorized.status_code == 403
    item = add_item(client).json()
    login(client, 'reporter@kmitl.ac.th')
    report = client.post('/reports', json={'listing_id': item['id'],
        'reason': 'ลงสินค้าต้องห้ามและข้อมูลหลอกลวง'}, headers=ORIGIN)
    assert report.status_code == 201
    login(client, 'teacher@kmitl.ac.th')
    admin = client.get('/admin/reports')
    assert admin.status_code == 200 and len(admin.json()) == 1
    assert client.post(f'/admin/listings/{item["id"]}/remove', headers=ORIGIN).status_code == 200
    assert client.get(f'/listings/{item["id"]}').status_code == 404
    assert client.post(f'/admin/reports/{admin.json()[0]["id"]}/resolve', headers=ORIGIN).status_code == 200


def test_upload_rejects_wrong_type_and_compresses(client):
    login(client, 'photo@kmitl.ac.th')
    item = add_item(client).json()
    bad = client.post(f'/listings/{item["id"]}/images',
                      files={'file': ('payload.svg', b'<svg/>', 'image/svg+xml')}, headers=ORIGIN)
    assert bad.status_code == 415
    img = Image.new('RGB', (500, 500), (255, 120, 50))
    data = io.BytesIO()
    img.save(data, format='PNG')
    good = client.post(f'/listings/{item["id"]}/images',
                       files={'file': ('photo.png', data.getvalue(), 'image/png')}, headers=ORIGIN)
    assert good.status_code == 200, good.text
    assert good.json()['url'].endswith('.webp')
    assert len(good.json()['images']) == 1
    avatar = client.post('/users/me/avatar',
                         files={'file': ('photo.png', data.getvalue(), 'image/png')}, headers=ORIGIN)
    assert avatar.status_code == 200
    assert client.get('/users/me').json()['avatar_url'].endswith('.webp')


def test_otp_fails_for_invalid_code(client):
    res = client.post('/auth/request-otp', json={'email': 'invalid@kmitl.ac.th'})
    assert res.status_code == 200
    for _ in range(5):
        assert client.post('/auth/verify-otp', json={'email': 'invalid@kmitl.ac.th',
            'otp': 'not-valid'}).status_code == 422
    # Submit six-digit incorrect OTP and verify 5 attempt cap.
    wrong = '000000' if res.json()['dev_otp'] != '000000' else '111111'
    for _ in range(5):
        assert client.post('/auth/verify-otp', json={'email': 'invalid@kmitl.ac.th',
                                                    'otp': wrong}).status_code == 400
    assert client.post('/auth/verify-otp', json={'email': 'invalid@kmitl.ac.th',
        'otp': res.json()['dev_otp']}).status_code == 400
