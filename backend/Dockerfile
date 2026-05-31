FROM python:3.11-slim

# Системные зависимости
RUN rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Устанавливаем зависимости
COPY requirements.txt .
RUN pip install --break-system-packages --no-cache-dir -r requirements.txt

# Копируем исходный код
COPY . .

# Создаём директорию для медиа
RUN mkdir -p /app/media /app/static

EXPOSE 8000

# Запуск: миграции + сервер
CMD ["sh", "-c", "python manage.py migrate --noinput && python manage.py runserver 0.0.0.0:8000"]
