# FILE: main.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import joblib
import pandas as pd
import numpy as np
import uvicorn

app = FastAPI(title="Demand Forecasting API", version="1.0")

artifacts = {
    "model": None,
    "features": None,
    "categories_map": None
}

@app.on_event("startup")
def load_artifacts():
    try:
        artifacts["model"] = joblib.load('demand_forecast_model.pkl')
        artifacts["features"] = joblib.load('model_features.pkl')
        artifacts["categories_map"] = joblib.load('model_categories_map.pkl')
        print("Model and artifacts loaded successfully.")
    except Exception as e:
        print(f"Error loading model: {e}")

class DemandInput(BaseModel):
    year: int
    month: int
    weekday: int
    is_weekend: int
    is_holiday: int
    temperature: float
    rain_mm: float
    list_price: float
    discount_pct: float
    lag_7: float
    lag_14: float
    store_id: str
    sku_id: str
    category: str

@app.post("/predict")
def predict_demand(input_data: DemandInput):
    model = artifacts["model"]
    features = artifacts["features"]
    cat_map = artifacts["categories_map"]

    if not model:
        raise HTTPException(status_code=500, detail="Model not loaded")

    try:
        data_dict = input_data.dict()
        df_input = pd.DataFrame([data_dict])
        df_input = df_input[features]
        cat_cols = ['store_id', 'sku_id', 'category']

        for col in cat_cols:
            if col in cat_map:
                cat_type = pd.CategoricalDtype(categories=cat_map[col], ordered=False)
                df_input[col] = df_input[col].astype(cat_type)
            else:
                df_input[col] = df_input[col].astype('category')

        prediction = model.predict(df_input)
        result = max(0, float(prediction[0]))

        return {
            "sku_id": input_data.sku_id,
            "predicted_demand": round(result, 2)
        }

    except Exception as e:
        print("Error during prediction:", str(e))
        raise HTTPException(status_code=400, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)