from .conftest import add_item, login

ORIGIN = {'Origin': 'http://localhost:3000'}


def test_email_restriction_and_otp(client):
    assert client.post('/auth/request-otp', json={'email': 'alice@gmail.com'}).status_code == 422
    login(client, 'alice@kmitl.ac.th')
    assert client.get('/users/me').json()['verified'] is True
    assert client.post('/auth/request-otp', json={'email': 'alice@kmitl.ac.th'}, headers=ORIGIN).status_code == 429


def test_owner_and_reservation_and_review(client):
    seller_cookie = login(client, 'seller@kmitl.ac.th')
    created = add_item(client)
    assert created.status_code == 201, created.text
    listing_id = created.json()['id']
    login(client, 'buyer@kmitl.ac.th')
    denied = client.patch(f'/listings/{listing_id}', json={'price': 100}, headers=ORIGIN)
    assert denied.status_code == 403
    assert client.post('/reviews', json={'reservation_id': 999, 'stars': 5,
        'content': 'ดีมาก'}, headers=ORIGIN).status_code == 403
    reserved = client.post(f'/listings/{listing_id}/reserve', headers=ORIGIN)
    assert reserved.status_code == 200
    booking_id = reserved.json()['reservation_id']
    assert client.post(f'/listings/{listing_id}/reserve', headers=ORIGIN).status_code == 409
    buyer_cookie = client.cookies.get('kmitl_session')
    client.cookies.set('kmitl_session', seller_cookie)
    assert client.post(f'/listings/{listing_id}/complete', headers=ORIGIN).status_code == 200
    client.cookies.set('kmitl_session', buyer_cookie)
    completed = client.post('/reviews', json={'reservation_id': booking_id, 'stars': 5,
                                              'content': 'ผู้ขายตอบเร็วมาก'}, headers=ORIGIN)
    assert completed.status_code == 201
    assert client.post('/reviews', json={'reservation_id': booking_id, 'stars': 5,
                                         'content': 'ซ้ำ'}, headers=ORIGIN).status_code == 409
    assert client.get(f'/users/{created.json()["seller_id"]}').json()['seller_rating'] == 5.0


def test_filter_price_drop_csrf_and_chat(client):
    seller_cookie = login(client, 's2@kmitl.ac.th')
    item = add_item(client, 'เครื่องคิดเลข Casio').json()
    item_id = item['id']
    assert client.get('/listings?q=Casio&max_price=300').json()[0]['id'] == item_id
    assert client.patch(f'/listings/{item_id}', json={'price': 10}).status_code == 403
    seller_id = item['seller_id']
    login(client, 'buyer2@kmitl.ac.th')
    assert client.post(f'/listings/{item_id}/favorite', headers=ORIGIN).status_code == 200
    msg = client.post(f'/listings/{item_id}/messages', json={
        'partner_id': seller_id, 'content': 'นัดรับได้ไหม?', 'kind': 'text'}, headers=ORIGIN)
    assert msg.status_code == 201, msg.text
    buyer_id = client.get('/users/me').json()['id']
    buyer_cookie = client.cookies.get('kmitl_session')
    client.cookies.set('kmitl_session', seller_cookie)
    assert client.patch(f'/listings/{item_id}', json={'price': 200}, headers=ORIGIN).status_code == 200
    assert client.get('/chats').json()[0]['partner_id'] == buyer_id
    client.cookies.set('kmitl_session', buyer_cookie)
    notes = client.get('/notifications').json()
    assert any('ลดราคา' in n['content'] for n in notes)


def test_reporting_requires_login(client):
    assert client.post('/reports', json={'listing_id': 1, 'reason': 'สินค้าต้องห้าม'}).status_code == 401
