from fastapi import FastAPI, WebSocket
from typing import List, Dict
import json
import sqlite3
from datetime import datetime
import os

app = FastAPI()

active_connections: List[Dict[str, WebSocket | str]] = []

def init_db():
    os.makedirs('data', exist_ok=True)
    
    conn = sqlite3.connect('data/chat.db')
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS messages
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  username TEXT NOT NULL,
                  message TEXT NOT NULL,
                  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)''')
    conn.commit()
    conn.close()

init_db()

async def save_message(username: str, message: str):
    conn = sqlite3.connect('data/chat.db')
    c = conn.cursor()
    c.execute('INSERT INTO messages (username, message) VALUES (?, ?)',
              (username, message))
    conn.commit()
    conn.close()

async def get_last_messages():
    conn = sqlite3.connect('data/chat.db')
    c = conn.cursor()
    c.execute('''SELECT username, message FROM messages 
                 ORDER BY timestamp DESC LIMIT 100''')
    messages = c.fetchall()
    conn.close()
    return [f"{username}: {message}" for username, message in reversed(messages)]

async def broadcast(message: str, username: str):
    formatted_message = f"{username}: {message}"
    await save_message(username, message)
    for connection in active_connections:
        await connection['websocket'].send_text(formatted_message)

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    
    username = await websocket.receive_text()
    
    last_messages = await get_last_messages()
    for msg in last_messages:
        await websocket.send_text(msg)
    
    connection_info = {"websocket": websocket, "username": username}
    active_connections.append(connection_info)
    
    try:
        while True:
            data = await websocket.receive_text()
            await broadcast(data, username)
    except:
        active_connections.remove(connection_info)
