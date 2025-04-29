from catboost import CatBoostRegressor
import pandas as pd
import numpy as np

class ExchangeRatePredictor:
    def __init__(self):
        self.model = CatBoostRegressor(
            iterations=100,
            learning_rate=0.05,
            depth=6,
            loss_function='RMSE',
            verbose=0
        )
    
    def preprocess_data(self, df):
        df['date'] = pd.to_datetime(df['date'])
        df = df.sort_values('date')
        
        df['lag_1'] = df['rate'].shift(1)
        df['lag_7'] = df['rate'].shift(7)
        df['rolling_avg_7'] = df['rate'].rolling(7).mean()
        
        df['target'] = df['rate'].shift(-3)
        
        return df.dropna()
    
    def train(self, df):
        df = self.preprocess_data(df)
        X = df[['lag_1', 'lag_7', 'rolling_avg_7']]
        y = df['target']
        self.model.fit(X, y)
    
    def predict(self, last_rates):
        return self.model.predict([last_rates])