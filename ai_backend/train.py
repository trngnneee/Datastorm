import numpy as np
import lightgbm as lgb
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error
import matplotlib.pyplot as plt
import seaborn as sns
import joblib
import pandas as pd

np.random.seed(42)
data_path =  "../data/r2/Retail/FMCG Multi-Country Sales Dataset/fmcg_sales_3years_1M_rows.csv"

def load_data(file_path):
    df = pd.read_csv(file_path)
    df['date'] = pd.to_datetime(df['date'])

    return df

df = load_data(data_path)

def feature_engineering(df):
    df['date'] = pd.to_datetime(df['date'])
    df = df.sort_values(by=['store_id', 'sku_id', 'date'])
    df['units_sold_for_lag'] = df['units_sold']
    df.loc[df['stock_out_flag'] == 1, 'units_for_lag'] = np.nan
    df['units_for_lag'] = df.groupby(['store_id', 'sku_id'])['units_for_lag'].transform(
        lambda x: x.fillna(x.rolling(window=7, min_periods=1).mean())
    ).fillna(0)

    # Lag feature
    for lag in [1, 3, 7, 14, 28]:
        df[f'lag_{lag}'] = df.groupby(['store_id', 'sku_id'])['units_sold'].shift(lag)

    df = df.drop(columns=['units_for_lag'])

    # Categorical encoding
    cats = ['store_id', 'city', 'sku_id', 'category', 'brand', 'weekday']
    for c in cats:
        if c in df.columns:
            df[c] = df[c].astype('category')

    return df

df_processed = feature_engineering(df)

train_mask = (df_processed['stock_out_flag'] == 0) & (df_processed['date'] < '2023-10-01')
val_mask = (df_processed['stock_out_flag'] == 0) & (df_processed['date'] >= '2023-10-01')

features = ['year', 'month', 'weekday', 'is_weekend', 'is_holiday',
            'temperature', 'rain_mm', 'list_price', 'discount_pct',
            'lag_7', 'lag_14', 'store_id', 'sku_id', 'category']

X_train = df_processed.loc[train_mask, features]
y_train = df_processed.loc[train_mask, 'units_sold']

X_val = df_processed.loc[val_mask, features]
y_val = df_processed.loc[val_mask, 'units_sold']

model = lgb.LGBMRegressor(n_estimators=1000, learning_rate=0.05)
model.fit(X_train, y_train,
          eval_set=[(X_val, y_val)],
          callbacks=[lgb.early_stopping(stopping_rounds=50)])

cat_cols = ['store_id', 'sku_id', 'category']
categories_map = {}
for col in cat_cols:
    categories_map[col] = X_train[col].cat.categories.tolist()

joblib.dump(model, 'demand_forecast_model.pkl')
joblib.dump(features, 'model_features.pkl')
joblib.dump(categories_map, 'model_categories_map.pkl')
print("All artifacts saved!")