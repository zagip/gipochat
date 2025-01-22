# GIPOCHAT
## Hacker-themed realtime chatroom

### How to run:
- Make sure u removed frontend/node_modules
- Edit ports in docker compose
- Edit **VITE_WS_URL** from frontend/.env to your backend server url
- Add ur host to frontend/vite.config.ts
- Run `docker compose up -d`

### Как запустить:
- Удалите frontend/node_modules, если есть
- Отредактируйте порты в docker compose
- Отредактируйте **VITE_WS_URL** из frontend/.env на ваш url backend-а
- Добавьте ваш хост в frontend/vite.config.ts
- Запустите `docker compose up -d`
