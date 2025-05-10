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

cache = {
    'last_update': 0,
    'data': None,
    'cache_timeout': 3600
}

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/predict", methods=["GET"])
def predict():
    refresh = request.args.get('refresh', 'false').lower() == 'true'
    
    current_time = time.time()
    cache_expired = (current_time - cache['last_update']) > cache['cache_timeout']
    
    if not refresh and not cache_expired and cache['data'] is not None:
        return jsonify(cache['data'])
    
    df = api.get_historical(target_currency="KRW", days=60)
    db.insert_rates(df)
    
    model.train(df)
    
    last_row = df.iloc[-1]
    last_features = [
        last_row['rate'],
        df.iloc[-7]['rate'] if len(df) > 7 else last_row['rate'],
        df['rate'].tail(7).mean()
    ]
    prediction = model.predict(last_features)
    
    result = {
        "history": df.to_dict("records"),
        "prediction": float(prediction[0])
    }
    
    cache['data'] = result
    cache['last_update'] = current_time
    
    return jsonify(result)

@app.route("/data")
def view_data():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    offset = (page - 1) * per_page
    format_type = request.args.get('format', '')
    
    total_count = db.get_rates_count()
    
    pages = (total_count + per_page - 1) // per_page
    
    if page > pages and pages > 0:
        page = pages
        offset = (page - 1) * per_page
    
    data = db.get_rates(limit=per_page, offset=offset)
    
    if format_type.lower() == 'csv':
        return generate_csv(db.get_all_rates())
    
    return render_template('data.html', data=data, pages=pages, current_page=page)

def generate_csv(data):
    si = io.StringIO()
    csv_writer = csv.writer(si)
    
    csv_writer.writerow(['date', 'usd_to_krw'])
    
    for row in data:
        csv_writer.writerow(row)
    
    output = make_response(si.getvalue())
    output.headers["Content-Disposition"] = "attachment; filename=exchange_rates.csv"
    output.headers["Content-type"] = "text/csv"
    
    return output

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)