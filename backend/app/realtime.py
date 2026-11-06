"""In-memory WebSocket fanout. Use Redis pub/sub for multiple workers in production."""
from fastapi import WebSocket


class ConnectionManager:
    def __init__(self):
        self.connections: dict[int, list[WebSocket]] = {}

    async def connect(self, user_id: int, ws: WebSocket):
        await ws.accept()
        self.connections.setdefault(user_id, []).append(ws)

    def disconnect(self, user_id: int, ws: WebSocket):
        pool = self.connections.get(user_id, [])
        if ws in pool:
            pool.remove(ws)
        if not pool:
            self.connections.pop(user_id, None)

    async def emit(self, user_id: int, payload: dict):
        for ws in self.connections.get(user_id, []).copy():
            try:
                await ws.send_json(payload)
            except RuntimeError:
                self.disconnect(user_id, ws)


manager = ConnectionManager()
