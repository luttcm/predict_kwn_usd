from flask import Flask, render_template, jsonify, url_for
from app.api_client import ExchangeRateAPI
from database.db_handler import Database
from ml.catboost_model import ExchangeRatePredictor
import pandas as pd
import os

app = Flask(__name__, 
           static_folder=os.path.join('app', 'static'),
           template_folder=os.path.join('app', 'templates'))
           
api = ExchangeRateAPI()
db = Database()
model = ExchangeRatePredictor()

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/predict", methods=["GET"])
def predict():
    df = api.get_historical(target_currency="KRW", days=60)
    db.insert_rates(df)
    
    model.train(df)
    
    last_row = df.iloc[-1]
    last_features = [
        last_row['rate'],  # lag_1
        df.iloc[-7]['rate'] if len(df) > 7 else last_row['rate'],  # lag_7
        df['rate'].tail(7).mean()  # rolling_avg_7
    ]
    prediction = model.predict(last_features)
    
    return jsonify({
        "history": df.to_dict("records"),
        "prediction": float(prediction[0])
    })

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)