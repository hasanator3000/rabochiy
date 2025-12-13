# Node.js Dockerfile для Railway с поддержкой PostgreSQL
FROM node:18-alpine

# Установим необходимые зависимости для сборки
RUN apk add --no-cache python3 make g++

# Установим рабочую директорию
WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm ci --omit=dev
RUN npm install -g tsx

# Копируем весь исходный код
COPY . .

# Set environment variables for Railway
# DATABASE_URL будет установлен автоматически Railway при добавлении PostgreSQL
ENV TELEGRAM_BOT_TOKEN=$TELEGRAM_BOT_TOKEN
ENV NODE_ENV=production

# Запускаем бота
CMD ["npm", "run", "bot"]
