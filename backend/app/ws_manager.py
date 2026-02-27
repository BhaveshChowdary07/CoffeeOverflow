from typing import List
from starlette.websockets import WebSocket

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast_json(self, data):
        for connection in list(self.active_connections):
            try:
                await connection.send_json(data)
            except Exception:
                try:
                    self.active_connections.remove(connection)
                except Exception:
                    pass

manager = ConnectionManager()
