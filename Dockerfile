# Node.js Dockerfile для Railway с поддержкой SQLite
FROM node:18-alpine

# Установим SQLite и необходимые зависимости
RUN apk add --no-cache python3 make g++ sqlite

# Установим рабочую директорию
WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm ci --omit=dev
RUN npm install -g tsx

# Копируем весь исходный код
COPY . .

# Создаем директорию для данных БД
RUN mkdir -p /app/data

# Set environment variables for Railway
ENV DB_PATH=/data/telegram.db
ENV TELEGRAM_BOT_TOKEN=$TELEGRAM_BOT_TOKEN

# Запускаем бота
CMD ["npm", "run", "bot"]
