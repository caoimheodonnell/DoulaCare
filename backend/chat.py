# backend/chat.py
# Simple connection manager for community chat
# https://www.youtube.com/watch?v=nZhAW-JQ8NM - inspired this structure

from typing import Set
from starlette.websockets import WebSocket
from asyncio import Lock


class ConnectionManager:
    def __init__(self) -> None:
        # In the video, he uses a LIST: self.active_connections = []
        # I improved it by using a SET instead:
        # - no duplicates
        # - faster removal
        # - cleaner for WebSocket tracking
        self.connections: Set[WebSocket] = set()
        # The YouTube video doesnt  use a lock.
        # This is more safe when many clients connect/disconnect.
        self.lock = Lock()

    async def connect(self, ws: WebSocket) -> None:
        """
               Accepts a new WebSocket connection and stores it.
               This behavior is the same as in the video, except
               I store it inside a set instead of a list.
               """
        await ws.accept()
        async with self.lock:
            self.connections.add(ws)

    async def disconnect(self, ws: WebSocket) -> None:
        """
             Removes a WebSocket connection when a client disconnects.
             Similar to the video, but using 'discard' avoids errors if missing.
             """
        async with self.lock:
            self.connections.discard(ws)

    async def broadcast(self, message: dict) -> None:
        """
                Sends a JSON message to every connected client.
                This is similar to the broadcast function in the video,
                but I use JSON instead of plain text

                """
        dead = []
        async with self.lock:
            for ws in list(self.connections):
                try:
                    # The video uses send_text() but send_json send structured data
                    await ws.send_json(message)
                except Exception:
                    dead.append(ws)
            for ws in dead:
                self.connections.discard(ws)

# Same as in the video: create a global manager instance
manager = ConnectionManager()
