#!/bin/bash

# Скрипт для подключения к Railway по SSH

echo "🚂 Railway SSH Connection Helper"
echo ""

# Проверка авторизации
if ! railway whoami &>/dev/null; then
    echo "❌ Вы не авторизованы в Railway"
    echo "📝 Выполните: npm run railway:login"
    exit 1
fi

echo "✅ Авторизован в Railway"
echo ""

# Проверка привязки проекта
if [ ! -f ".railway/project.json" ]; then
    echo "⚠️  Проект не привязан к Railway"
    echo "📝 Выполните: npm run railway:link"
    echo ""
    read -p "Привязать проект сейчас? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        railway link
    else
        exit 1
    fi
fi

echo "🔗 Подключение к Railway по SSH..."
railway ssh

