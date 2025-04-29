from flask import Flask, render_template, jsonify, url_for, request, make_response
from app.api_client import ExchangeRateAPI
from database.db_handler import Database
from ml.catboost_model import ExchangeRatePredictor
import pandas as pd
import os
import time
import csv
import io

app = Flask(__name__, 
           static_folder=os.path.join('app', 'static'),
           template_folder=os.path.join('app', 'templates'))
           
api = ExchangeRateAPI()
db = Database()
model = ExchangeRatePredictor()

# Кеш данных для оптимизации
cache = {
    'last_update': 0,
    'data': None,
    'cache_timeout': 3600  # Время жизни кеша в секундах (1 час)
}

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/predict", methods=["GET"])
def predict():
    # Проверяем, нужно ли игнорировать кеш и обновить данные
    refresh = request.args.get('refresh', 'false').lower() == 'true'
    
    current_time = time.time()
    cache_expired = (current_time - cache['last_update']) > cache['cache_timeout']
    
    # Используем кешированные данные, если они есть и не устарели
    if not refresh and not cache_expired and cache['data'] is not None:
        return jsonify(cache['data'])
    
    # Получаем данные
    df = api.get_historical(target_currency="KRW", days=60)
    db.insert_rates(df)
    
    # Обучаем модель
    model.train(df)
    
    # Делаем прогноз
    last_row = df.iloc[-1]
    last_features = [
        last_row['rate'],  # lag_1
        df.iloc[-7]['rate'] if len(df) > 7 else last_row['rate'],  # lag_7
        df['rate'].tail(7).mean()  # rolling_avg_7
    ]
    prediction = model.predict(last_features)
    
    # Создаем результат
    result = {
        "history": df.to_dict("records"),
        "prediction": float(prediction[0])
    }
    
    # Обновляем кеш
    cache['data'] = result
    cache['last_update'] = current_time
    
    return jsonify(result)

@app.route("/data")
def view_data():
    # Получаем параметры из запроса
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    offset = (page - 1) * per_page
    format_type = request.args.get('format', '')
    
    # Получаем общее количество записей
    total_count = db.get_rates_count()
    
    # Вычисляем количество страниц
    pages = (total_count + per_page - 1) // per_page
    
    # Проверяем, если страница выходит за пределы, устанавливаем последнюю страницу
    if page > pages and pages > 0:
        page = pages
        offset = (page - 1) * per_page
    
    # Получаем данные с пагинацией
    data = db.get_rates(limit=per_page, offset=offset)
    
    # Если запрошен формат CSV, возвращаем файл для скачивания
    if format_type.lower() == 'csv':
        return generate_csv(db.get_all_rates())
    
    # Возвращаем HTML-страницу с данными
    return render_template('data.html', data=data, pages=pages, current_page=page)

def generate_csv(data):
    # Создаем буфер в памяти для CSV файла
    si = io.StringIO()
    csv_writer = csv.writer(si)
    
    # Записываем заголовки
    csv_writer.writerow(['date', 'usd_to_krw'])
    
    # Записываем данные
    for row in data:
        csv_writer.writerow(row)
    
    # Создаем HTTP-ответ с CSV файлом
    output = make_response(si.getvalue())
    output.headers["Content-Disposition"] = "attachment; filename=exchange_rates.csv"
    output.headers["Content-type"] = "text/csv"
    
    return output

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)