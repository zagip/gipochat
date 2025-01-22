FROM node:23.6.0-slim

WORKDIR /app

COPY . .
RUN npm install
RUN npm run build

EXPOSE 80

CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "80"]