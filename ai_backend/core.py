import pandas as pd
import numpy as np
import xgboost as xgb
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import mean_squared_error, mean_absolute_error
from typing import Dict, Any, List, Optional
import logging
import sys

# --- Logging Configuration ---
# Configures a clean output format: "Timestamp - Message"
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(message)s",
    datefmt="%H:%M:%S",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger(__name__)

# --- Helper Functions: Metrics ---
def calculate_wmape(y_true, y_pred):
    """Calculates Weighted Mean Absolute Percentage Error (Retail Standard)."""
    sum_abs_diff = np.sum(np.abs(y_true - y_pred))
    sum_abs_true = np.sum(np.abs(y_true))
    return sum_abs_diff / sum_abs_true if sum_abs_true > 0 else 0.0

def calculate_rmse(y_true, y_pred):
    """Calculates Root Mean Squared Error."""
    return np.sqrt(mean_squared_error(y_true, y_pred))

def calculate_mape(y_true, y_pred):
    """Calculates Mean Absolute Percentage Error."""
    return np.mean(np.abs((y_true - y_pred) / y_true)) * 100 if np.all(y_true != 0) else 0.0

class DataImputer:
    """
    STAGE 1: CENSORED DEMAND IMPUTATION
    Corrects sales data on out-of-stock days.
    """
    def __init__(self):
        self.model = None
        self.encoders = {}
        # Features used to learn the demand pattern
        self.feature_cols = [
            'year', 'month', 'day', 'weekday', 'is_weekend', 'is_holiday',
            'temperature', 'list_price', 'discount_pct', 'promo_flag',
            'store_id', 'sku_id', 'category', 'brand',
            'stock_opening'
        ]
        self.cat_cols = ['store_id', 'sku_id', 'category', 'brand']

    def _preprocess(self, df: pd.DataFrame, is_training: bool = True) -> pd.DataFrame:
        data = df.copy()
        # Fill missing numeric cols
        for col in self.feature_cols:
            if col not in data.columns:
                data[col] = 0
        
        X = data[self.feature_cols].copy()

        # Encode categorical variables
        for col in self.cat_cols:
            X[col] = X[col].astype(str)
            if is_training:
                le = LabelEncoder()
                X[col] = le.fit_transform(X[col])
                self.encoders[col] = le
            else:
                if col in self.encoders:
                    le = self.encoders[col]
                    # Handle unseen labels by mapping to -1
                    X[col] = X[col].map(lambda s: le.transform([s])[0] if s in le.classes_ else -1)
        return X

    def train_and_impute(self, df: pd.DataFrame) -> pd.DataFrame:
        logger.info(">>> [Stage 1] Censored Demand Imputation Started...")

        # 1. Filter valid data (Stock was available)
        train_mask = df['stock_out_flag'] == 0
        df_train = df[train_mask].copy()

        X_train = self._preprocess(df_train, is_training=True)
        # Explicitly cast to float to avoid pandas warnings
        y_train = df_train['units_sold'].astype(float)

        # 2. Train XGBoost (Poisson objective for count data)
        self.model = xgb.XGBRegressor(
            n_estimators=500, max_depth=10, learning_rate=0.05, n_jobs=-1,
            objective='count:poisson', random_state=42
        )
        self.model.fit(X_train, y_train)

        # 3. Predict for Out-of-Stock rows
        impute_mask = df['stock_out_flag'] == 1
        
        # Initialize 'adjusted_demand' with original sales
        df['adjusted_demand'] = df['units_sold'].astype(float)

        if impute_mask.sum() > 0:
            logger.info(f"    - Found {impute_mask.sum()} censored rows to impute.")
            df_missing = df[impute_mask].copy()
            X_missing = self._preprocess(df_missing, is_training=False)

            predicted_demand = self.model.predict(X_missing)
            
            # Logic: True Demand >= Actual Sales. Take the maximum.
            current_sales = df.loc[impute_mask, 'units_sold'].astype(float)
            adjusted = np.maximum(predicted_demand, current_sales)

            # Update adjusted demand
            df.loc[impute_mask, 'adjusted_demand'] = adjusted
        
        logger.info(">>> [Stage 1] Imputation Completed.")
        logger.info("-" * 40)
        return df

class MultiHorizonForecaster:
    """
    STAGE 2: DIRECT MULTI-STEP FORECASTING
    Manages separate models for different horizons (T+1, T+7, T+14).
    """
    def __init__(self, horizons: List[int] = [1, 7, 14]):
        self.horizons = horizons
        self.models = {} 
        self.encoders = {}
        self.base_features = [
            'month', 'weekday', 'is_weekend', 'is_holiday', 'dayofyear',
            'month_sin', 'month_cos', 'weekday_sin', 'weekday_cos',
            'temperature', 'list_price', 'discount_pct', 'promo_flag',
            'store_id', 'sku_id', 'category', 'brand',
            'stock_opening' 
        ]
        self.lag_cols = []

    def _create_features(self, df: pd.DataFrame, target_col: str = 'adjusted_demand') -> pd.DataFrame:
        """Generates Lag, Rolling Mean, EWMA, and Seasonality features."""
        df = df.copy().sort_values(['store_id', 'sku_id', 'date'])
        self.lag_cols = [] # Reset to avoid duplication
        
        # Ensure date is datetime
        if 'date' in df.columns:
            df['date'] = pd.to_datetime(df['date'])
            df['dayofyear'] = df['date'].dt.dayofyear
            df['month_sin'] = np.sin(2 * np.pi * df['date'].dt.month / 12)
            df['month_cos'] = np.cos(2 * np.pi * df['date'].dt.month / 12)
            df['weekday_sin'] = np.sin(2 * np.pi * df['date'].dt.weekday / 7)
            df['weekday_cos'] = np.cos(2 * np.pi * df['date'].dt.weekday / 7)
        
        # 1. Extended Lags
        for lag in [1, 2, 3, 7, 14, 21, 28]:
            col_name = f'lag_{lag}'
            df[col_name] = df.groupby(['store_id', 'sku_id'])[target_col].shift(lag)
            self.lag_cols.append(col_name)

        # 2. Rolling Means
        for window in [3, 7, 14, 30]:
            col_name = f'rolling_mean_{window}'
            df[col_name] = df.groupby(['store_id', 'sku_id'])[target_col].transform(
                lambda x: x.shift(1).rolling(window).mean()
            )
            self.lag_cols.append(col_name)

        # 3. Exponential Weighted Moving Averages
        for alpha in [0.1, 0.3]:
            col_name = f'ewma_{int(alpha*10)}'
            df[col_name] = df.groupby(['store_id', 'sku_id'])[target_col].transform(
                lambda x: x.shift(1).ewm(alpha=alpha).mean()
            )
            self.lag_cols.append(col_name)

        return df

    def _prepare_xy(self, df: pd.DataFrame, horizon: int):
        """Prepares Feature Matrix X and Target Vector y."""
        data = df.copy()
        
        # Target: Sales at (T + horizon)
        data['target'] = data.groupby(['store_id', 'sku_id'])['adjusted_demand'].shift(-horizon)
        data = data.dropna() # Drop rows with NaN (lags or target)
        
        feature_cols = self.base_features + list(set(self.lag_cols))

        # Encode categoricals
        for col in ['store_id', 'sku_id', 'category', 'brand']:
            le = LabelEncoder()
            data[col] = le.fit_transform(data[col].astype(str))
            # Save encoder only for the first horizon model to keep state
            if horizon == self.horizons[0]:
                self.encoders[col] = le

        return data[feature_cols], data['target'], feature_cols

    def train(self, df: pd.DataFrame, use_existing_features: bool = False):
        logger.info(">>> [Stage 2] Forecasting Training (Multi-Horizon)...")
        
        # Use provided features or generate new ones
        if use_existing_features:
            df_rich = df.copy()
        else:
            df_rich = self._create_features(df)

        for h in self.horizons:
            X, y, feature_names = self._prepare_xy(df_rich, horizon=h)
            
            # Improved XGBoost with Tweedie for positive skewed data
            model = xgb.XGBRegressor(
                n_estimators=1000, max_depth=8, learning_rate=0.05, n_jobs=-1,
                objective='reg:tweedie', tweedie_variance_power=1.5, random_state=42,
                early_stopping_rounds=50, eval_metric='rmse'
            )
            # Use eval_set for early stopping
            eval_set = [(X, y)]
            model.fit(X, y, eval_set=eval_set, verbose=False)

            self.models[h] = {
                'model': model,
                'features': feature_names
            }
            logger.info(f"    - Horizon T+{h} Model Trained.")
            
        logger.info(">>> [Stage 2] Training Completed.")
        logger.info("-" * 40)

    def predict(self, context_data: Dict, horizon: int) -> float:
        """Single instance prediction for API."""
        if horizon not in self.models:
            raise ValueError(f"No model trained for horizon {horizon}")

        model_info = self.models[horizon]
        model = model_info['model']
        feature_names = model_info['features']

        df_input = pd.DataFrame([context_data])

        for col, le in self.encoders.items():
            if col in df_input.columns:
                df_input[col] = df_input[col].apply(lambda x: le.transform([str(x)])[0] if str(x) in le.classes_ else -1)

        for col in feature_names:
            if col not in df_input.columns:
                df_input[col] = 0 

        X_pred = df_input[feature_names]
        prediction = model.predict(X_pred)[0]
        return max(0.0, float(prediction))

    def predict_batch_for_eval(self, df: pd.DataFrame, horizon: int, use_existing_features: bool = False) -> tuple:
        """Helper for batch evaluation."""
        if horizon not in self.models: return None, None
        model_info = self.models[horizon]
        model = model_info['model']
        
        if use_existing_features:
            df_rich = df.copy()
        else:
            df_rich = self._create_features(df)
            
        X, y_true, feature_cols = self._prepare_xy(df_rich, horizon)
        
        # Apply training encoders
        for col in ['store_id', 'sku_id', 'category', 'brand']:
            if col in self.encoders:
                le = self.encoders[col]
                X[col] = X[col].map(lambda s: le.transform([s])[0] if s in le.classes_ else -1)
                
        if len(X) == 0: return None, None
        y_pred = model.predict(X[feature_cols])
        return y_true, np.maximum(0, y_pred)

class LeadTimePredictor:
    """
    STAGE 3: LEAD TIME PREDICTION
    Predicts Supplier Lead Time (days).
    """
    def __init__(self):
        self.model = None
        self.encoders = {}
        self.feature_cols = [
            'year', 'month', 'day', 'weekofyear', 'weekday', 'is_weekend', 'is_holiday',
            'temperature', 'rain_mm', 'store_id', 'country', 'city', 'channel',
            'latitude', 'longitude', 'sku_id', 'sku_name', 'category', 'subcategory', 'brand', 'supplier_id'
        ]
        self.cat_cols = ['store_id', 'country', 'city', 'channel', 'sku_id', 'sku_name', 'category', 'subcategory', 'brand', 'supplier_id']

    def _preprocess(self, df: pd.DataFrame, is_training: bool = True) -> pd.DataFrame:
        data = df.copy()
        for col in self.feature_cols:
            if col not in data.columns: data[col] = 0
        X = data[self.feature_cols].copy()
        for col in self.cat_cols:
            X[col] = X[col].astype(str)
            if is_training:
                le = LabelEncoder()
                X[col] = le.fit_transform(X[col])
                self.encoders[col] = le
            else:
                if col in self.encoders:
                    le = self.encoders[col]
                    X[col] = X[col].map(lambda s: le.transform([s])[0] if s in le.classes_ else -1)
        return X

    def train(self, df: pd.DataFrame):
        logger.info(">>> [Stage 3] Lead Time Prediction Training...")
        X = self._preprocess(df, is_training=True)
        y = df['lead_time_days']
        self.model = xgb.XGBRegressor(
            n_estimators=500, max_depth=6, learning_rate=0.1, n_jobs=-1,
            objective='reg:squarederror', random_state=42
        )
        self.model.fit(X, y)
        logger.info(">>> [Stage 3] Training Completed.")
        logger.info("-" * 40)

    def predict(self, context: Dict) -> float:
        if self.model is None: raise Exception("Model not trained.")
        df_pred = pd.DataFrame([context])
        X_pred = self._preprocess(df_pred, is_training=False)
        return max(0.0, float(self.model.predict(X_pred)[0]))

    def predict_batch_for_eval(self, df: pd.DataFrame) -> tuple:
        if self.model is None: return None, None
        X = self._preprocess(df, is_training=False)
        y_true = df['lead_time_days']
        y_pred = self.model.predict(X)
        return y_true, np.maximum(0, y_pred)

class DemandPipeline:
    """
    FACADE Pattern: Orchestrates Imputation, Evaluation, and Production Training.
    """
    def __init__(self):
        self.imputer = DataImputer()
        self.forecaster = MultiHorizonForecaster(horizons=[1, 7, 14])
        self.lead_time_predictor = LeadTimePredictor()
        self.is_ready = False
        self.latest_metrics = {}

    def run_training_pipeline(self, df: pd.DataFrame):
        logger.info("=" * 50)
        logger.info("  PIPELINE EXECUTION STARTED")
        logger.info("=" * 50)
        
        # 1. Impute Censored Demand (on full dataset)
        df_imputed = self.imputer.train_and_impute(df)
        
        # 2. Evaluation Phase (Time-based Split)
        self._perform_evaluation(df_imputed)
        
        # 3. Production Phase (Retrain on Full Data)
        logger.info(">>> [Production] Retraining all models on FULL dataset...")
        
        # Note: We let forecaster generate features again on full data internally
        self.forecaster.train(df_imputed, use_existing_features=False) 
        self.lead_time_predictor.train(df)
        
        self.is_ready = True
        logger.info("=" * 50)
        logger.info("  PIPELINE FINISHED SUCCESSFULLY")
        logger.info("=" * 50)
        return self.latest_metrics

    def _perform_evaluation(self, df: pd.DataFrame):
        """
        Splits data into Train/Validation (Last 28 days) and calculates metrics
        for both Demand Forecast and Lead Time.
        """
        logger.info(">>> [Evaluation] Starting Evaluation Phase (Val Set = Last 28 days)...")
        max_date = df['date'].max()
        cutoff_date = max_date - pd.Timedelta(days=28)
        
        # --- KEY FIX: Generate Features GLOBALLY to preserve History (Lags) ---
        logger.info("    - Generating features globally to preserve lag history...")
        helper = MultiHorizonForecaster()
        df_rich = helper._create_features(df) # DF now contains lag_1, lag_7...
        
        # Time-based Split
        train_rich = df_rich[df_rich['date'] < cutoff_date].copy()
        test_rich = df_rich[df_rich['date'] >= cutoff_date].copy()
        
        # For Lead Time (doesn't use lags usually, but using raw split)
        train_raw = df[df['date'] < cutoff_date].copy()
        test_raw = df[df['date'] >= cutoff_date].copy()

        if len(test_rich) == 0:
            logger.warning("    ! Not enough data for validation!")
            return

        metrics = {}
        
        # --- A. Evaluate Demand Forecasting ---
        logger.info("    - Evaluating Demand Forecast Models...")
        temp_forecaster = MultiHorizonForecaster(horizons=[1, 7, 14])
        # Train on partial data
        temp_forecaster.train(train_rich, use_existing_features=True)
        
        for h in [1, 7, 14]:
            y_true, y_pred = temp_forecaster.predict_batch_for_eval(test_rich, horizon=h, use_existing_features=True)
            if y_true is not None and len(y_true) > 0:
                rmse = calculate_rmse(y_true, y_pred)
                mae = mean_absolute_error(y_true, y_pred)
                wmape = calculate_wmape(y_true, y_pred)
                mape = calculate_mape(y_true, y_pred)

                metrics[f"Forecast_H{h}"] = {
                    "RMSE": round(rmse, 2),
                    "MAE": round(mae, 2),
                    "WMAPE": f"{wmape:.2%}",
                    "MAPE": f"{mape:.2f}%"
                }
                logger.info(f"      [H+{h}] WMAPE: {wmape:.2%} | MAPE: {mape:.2f}% | RMSE: {rmse:.2f} | MAE: {mae:.2f}")
            else:
                logger.warning(f"      [H+{h}] No data available for evaluation.")

        # --- B. Evaluate Lead Time Prediction ---
        logger.info("    - Evaluating Lead Time Predictor...")
        temp_lt = LeadTimePredictor()
        temp_lt.train(train_raw)
        
        y_lt_true, y_lt_pred = temp_lt.predict_batch_for_eval(test_raw)
        
        if y_lt_true is not None and len(y_lt_true) > 0:
             rmse_lt = calculate_rmse(y_lt_true, y_lt_pred)
             mae_lt = mean_absolute_error(y_lt_true, y_lt_pred)
             
             metrics["Lead_Time"] = {
                "RMSE": round(rmse_lt, 2),
                "MAE": round(mae_lt, 2)
            }
             logger.info(f"      [Lead Time] RMSE: {rmse_lt:.2f} | MAE: {mae_lt:.2f}")
        else:
             logger.warning("      [Lead Time] No data available for evaluation.")

        self.latest_metrics = metrics
        logger.info(">>> [Evaluation] Phase Completed.")
        logger.info("-" * 40)

    def get_forecast(self, context, horizon):
        if not self.is_ready: raise Exception("Pipeline not trained.")
        return self.forecaster.predict(context, horizon)

    def get_lead_time_forecast(self, context):
        if not self.is_ready: raise Exception("Pipeline not trained.")
        return self.lead_time_predictor.predict(context)

# Singleton Instance
pipeline = DemandPipeline()