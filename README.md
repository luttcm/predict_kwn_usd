# KRW/USD Predict - Сервис прогнозирования курса валют

Веб-приложение для прогнозирования курса KRW/USD с использованием модели машинного обучения CatBoost.

## Функциональность

- Получение исторических данных о курсе KRW/USD
- Построение прогноза курса на 3 дня вперед с использованием CatBoost
- Визуализация исторических данных и прогноза
- Сохранение курсов в базу данных SQLite

## Технологии

- Python
- Flask
- CatBoost
- SQLite
- Plotly
- HTML/CSS/JavaScript (ванильный)

## Запуск с использованием Docker

### Сборка Docker-образа

```bash
docker build -t krw-usd-predict .
```

### Запуск контейнера

```bash
docker run -p 5000:5000 krw-usd-predict
```

После запуска приложение будет доступно по адресу: [http://localhost:5001](http://localhost:5001)

## Запуск без Docker

### Установка зависимостей

```bash
pip install -r requirements.txt
```

### Запуск приложения

```bash
python main.py
```

## Структура проекта

- `app/` - основная директория приложения
  - `api_client.py` - клиент для API обменных курсов
  - `templates/` - HTML-шаблоны
  - `static/` - статические файлы (CSS, JS)
- `database/` - работа с базой данных
  - `db_handler.py` - обработчик базы данных SQLite
- `ml/` - машинное обучение
  - `catboost_model.py` - модель CatBoost для прогнозирования
- `main.py` - основной файл приложения
- `config.py` - файл конфигурации
- `Dockerfile` - файл для создания Docker-образа 