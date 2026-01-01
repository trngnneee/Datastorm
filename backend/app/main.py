from fastapi import FastAPI, Query, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, case, literal
from .model.sales_fact import SalesFact
from .utils.db import get_db
from fastapi.middleware.cors import CORSMiddleware
import httpx
from datetime import datetime, timedelta

app = FastAPI(
    title="FMCG Sales Data API",
    description="API to retrieve FMCG sales data with pagination support.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"], 
    allow_headers=["*"],
)

@app.get("/country")
def get_rows(
    db: Session = Depends(get_db)
):
    countries = db.query(SalesFact.country).distinct().all()

    result = [c[0] for c in countries if c[0] is not None]

    return {
        "countries": result
    }

@app.get("/net_sales/daily")
def get_net_sales(
    country: str = Query("all", description="Country to filter by"),
    db: Session = Depends(get_db),
    year: str = Query("all", description="Filter by year, use 'all' for no filter"),
    month: str = Query("all", description="Filter by month, use 'all' for no filter"),
):
    query = db.query(
        SalesFact.date,
        func.sum(SalesFact.net_sales).label("net_sales")
    )

    yearList = db.query(func.extract("year", SalesFact.date).distinct()).order_by(func.extract("year", SalesFact.date)).all()

    if country != "all":
        query = query.filter(SalesFact.country == country)

    if year != "all":
        query = query.filter(func.extract("year", SalesFact.date) == int(year))
    if month != "all":
        query = query.filter(func.extract("month", SalesFact.date) == int(month))

    rows = query.group_by(SalesFact.date).order_by(SalesFact.date).all()

    start_date = rows[0].date if rows else None
    end_date = rows[-1].date if rows else None

    return {
        "meta": {
            "startDate": start_date,
            "endDate": end_date,
            "yearList": [int(y[0]) for y in yearList]
        },
        "data": [
            {"date": r.date, "net_sales": float(r.net_sales)}
            for r in rows
        ]
    }

@app.get("/unit_sold/daily")
def get_units_sold(
    country: str = Query("all", description="Country to filter by"),
    db: Session = Depends(get_db),
    year: str = Query("all", description="Filter by year, use 'all' for no filter"),
    month: str = Query("all", description="Filter by month, use 'all' for no filter"),
):
    query = db.query(
        SalesFact.date,
        func.sum(SalesFact.units_sold).label("units_sold")
    )

    yearList = db.query(func.extract("year", SalesFact.date).distinct()).order_by(func.extract("year", SalesFact.date)).all()

    if country != "all":
        query = query.filter(SalesFact.country == country)

    if year != "all":
        query = query.filter(func.extract("year", SalesFact.date) == int(year))
    if month != "all":
        query = query.filter(func.extract("month", SalesFact.date) == int(month))

    rows = query.group_by(SalesFact.date).order_by(SalesFact.date).all()

    start_date = rows[0].date if rows else None
    end_date = rows[-1].date if rows else None

    return {
        "meta": {
            "startDate": start_date,
            "endDate": end_date,
            "yearList": [int(y[0]) for y in yearList]
        },
        "data": [
            {"date": r.date, "units_sold": int(r.units_sold)}
            for r in rows
        ]
    }

@app.get("/net_sales/category")
def get_net_sales_by_category(
    country: str = Query("all", description="Country to filter by"),
    db: Session = Depends(get_db),
    year: str = Query("all", description="Filter by year, use 'all' for no filter"),
    month: str = Query("all", description="Filter by month, use 'all' for no filter"),
):
    query = db.query(
        SalesFact.category,
        func.sum(SalesFact.net_sales).label("net_sales")
    )

    if country != "all":
        query = query.filter(SalesFact.country == country)

    if year != "all":
        query = query.filter(func.extract("year", SalesFact.date) == int(year))
    if month != "all":
        query = query.filter(func.extract("month", SalesFact.date) == int(month))

    rows = query.group_by(SalesFact.category).order_by(SalesFact.category).all()

    return {
        "data": [
            {"category": r.category, "net_sales": float(r.net_sales)}
            for r in rows
        ]
    }

@app.get("/unit_sold/holiday_weekday")
def get_unit_sold_statistics(
    country: str = Query("all", description="Country to filter by"),
    db: Session = Depends(get_db),
    year: str = Query("all", description="Filter by year, use 'all' for no filter"),
    month: str = Query("all", description="Filter by month, use 'all' for no filter"),
):
    groups = {
        "weekday": lambda q: q.where(SalesFact.is_weekend == False),
        "weekend": lambda q: q.where(SalesFact.is_weekend == True),
        "holiday": lambda q: q.where(SalesFact.is_holiday == True),
        "non_holiday": lambda q: q.where(SalesFact.is_holiday == False),
    }

    result = {}

    for name, filter_fn in groups.items():
        query = db.query(
            func.sum(SalesFact.units_sold).label("total_units_sold"),
        )

        query = filter_fn(query)

        if country != "all":
            query = query.filter(SalesFact.country == country)
        if year != "all":
            query = query.filter(func.extract("year", SalesFact.date) == int(year))
        if month != "all":
            query = query.filter(func.extract("month", SalesFact.date) == int(month))

        res = query.one()

        result[name] = {
            "total_units_sold": int(res.total_units_sold) if res.total_units_sold is not None else 0
        }

    return result

@app.get("/sku/top")
def get_top_skus(
    country: str = Query("all", description="Country to filter by"),
    db: Session = Depends(get_db),
    year: str = Query("all", description="Filter by year, use 'all' for no filter"),
    month: str = Query("all", description="Filter by month, use 'all' for no filter"),
    limit: int = Query(20, description="Number of top SKUs to return"),
):
    query = db.query(
        SalesFact.sku_id,
        SalesFact.sku_name,
        func.sum(SalesFact.units_sold).label("units_sold")
    )

    if country != "all":
        query = query.filter(SalesFact.country == country)

    if year != "all":
        query = query.filter(func.extract("year", SalesFact.date) == int(year))

    if month != "all":
        query = query.filter(func.extract("month", SalesFact.date) == int(month))

    rows = query.group_by(SalesFact.sku_id, SalesFact.sku_name).order_by(func.sum(SalesFact.units_sold).desc()).limit(limit).all()

    return {
        "data": [
            {"sku_id": r.sku_id, "sku_name": r.sku_name, "units_sold": int(r.units_sold)}
            for r in rows
        ]
    }

@app.get("/unit_sold/promo")
def get_units_sold_discount_scatter(
    country: str = Query("all", description="Country to filter by"),
    db: Session = Depends(get_db),
    year: str = Query("all", description="Filter by year, use 'all' for no filter"),
    month: str = Query("all", description="Filter by month, use 'all' for no filter"),
):
    query = db.query(
        SalesFact.promo_flag,
        func.sum(SalesFact.units_sold).label("units_sold"),
        func.sum(SalesFact.net_sales).label("net_sales"),
    )

    if country != "all":
        query = query.filter(SalesFact.country == country)

    if year != "all":
        query = query.filter(func.extract("year", SalesFact.date) == int(year))

    if month != "all":
        query = query.filter(func.extract("month", SalesFact.date) == int(month))

    rows = (
        query
        .group_by(SalesFact.promo_flag)
        .all()
    )

    return {
        "data": [
            {
                "promo_flag": r.promo_flag,
                "units_sold": int(r.units_sold),
                "net_sales": float(r.net_sales)
            }
            for r in rows
        ]
    }

@app.get("/net_sales/location")
def get_net_sales_by_location(
    db: Session = Depends(get_db),
):
    query = db.query(
        SalesFact.store_id,
        SalesFact.latitude,
        SalesFact.longitude,

        func.sum(SalesFact.net_sales).label("net_sales"),

        func.sum(
            case(
                (SalesFact.stock_out_flag.is_(True), literal(1)),
                else_=literal(0)
            )
        ).label("stock_out_count"),

        func.count().label("total_count"),
    ).group_by(
        SalesFact.store_id,
        SalesFact.latitude,
        SalesFact.longitude
    )

    rows = query.all()

    return {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [r.longitude, r.latitude],
                },
                "properties": {
                    "store_id": r.store_id,
                    "net_sales": float(r.net_sales or 0),
                    "stock_out_count": int(r.stock_out_count or 0),
                    "stock_out_rate": float(
                        r.stock_out_count / r.total_count
                        if r.total_count else 0
                    ),
                },
            }
            for r in rows
            if r.latitude is not None and r.longitude is not None
        ],
    }

@app.post("/predict")
async def predict(
    request: dict,
    db: Session = Depends(get_db)
):
    try:
        store_id = request['store_id']
        sku_id = request['sku_id']
        date_str = request['date']  # 'YYYY-MM-DD'
        date = datetime.strptime(date_str, '%Y-%m-%d').date()
        # Calculate lags
        lag_dates = {
            'lag_1': date - timedelta(days=1),
            'lag_7': date - timedelta(days=7),
            'lag_14': date - timedelta(days=14),
            'lag_28': date - timedelta(days=28),
        }
        lags = {}
        for lag_name, lag_date in lag_dates.items():
            row = db.query(SalesFact.units_sold).filter(
                SalesFact.store_id == store_id,
                SalesFact.sku_id == sku_id,
                SalesFact.date == lag_date
            ).first()
            lags[lag_name] = float(row.units_sold) if row else 0.0
        # Rolling mean 7: average from date-6 to date
        rolling_7_start = date - timedelta(days=6)
        rolling_7_rows = db.query(SalesFact.units_sold).filter(
            SalesFact.store_id == store_id,
            SalesFact.sku_id == sku_id,
            SalesFact.date >= rolling_7_start,
            SalesFact.date <= date
        ).all()
        rolling_mean_7 = sum(r.units_sold for r in rolling_7_rows) / len(rolling_7_rows) if rolling_7_rows else 0.0
        # Rolling mean 30: from date-29 to date
        rolling_30_start = date - timedelta(days=29)
        rolling_30_rows = db.query(SalesFact.units_sold).filter(
            SalesFact.store_id == store_id,
            SalesFact.sku_id == sku_id,
            SalesFact.date >= rolling_30_start,
            SalesFact.date <= date
        ).all()
        rolling_mean_30 = sum(r.units_sold for r in rolling_30_rows) / len(rolling_30_rows) if rolling_30_rows else 0.0
        # Build the body
        body = {
            "horizon": request.get('horizon', 7),
            "month": request['month'],
            "weekday": request['weekday'],
            "is_weekend": request['is_weekend'],
            "is_holiday": request['is_holiday'],
            "temperature": request['temperature'],
            "list_price": request['list_price'],
            "discount_pct": request['discount_pct'],
            "promo_flag": request['promo_flag'],
            "store_id": store_id,
            "sku_id": sku_id,
            "category": request['category'],
            "brand": request['brand'],
            **lags,
            "rolling_mean_7": rolling_mean_7,
            "rolling_mean_30": rolling_mean_30
        }
        print("Stage 6")
        # Send to AI server
        async with httpx.AsyncClient() as client:
            response = await client.post("http://localhost:8001/predict", json=body)
            response.raise_for_status()
            return response.json()

    except KeyError as e:
        raise HTTPException(status_code=400, detail=f"Missing field: {e}")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid date format: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@app.get("/store/list")
def get_store_list(
    db: Session = Depends(get_db),
):
    query = db.query(
        SalesFact.store_id,
    ).distinct()

    rows = query.order_by(SalesFact.store_id).all()

    return {
        "data": [r.store_id for r in rows]
    }

@app.get("/category/list")
def get_store_category_list(
    db: Session = Depends(get_db),
):
    query = db.query(
        SalesFact.category,
    ).distinct()

    rows = query.order_by(SalesFact.category).all()

    return {
        "data": [r.category for r in rows]
    }

@app.get("/brand/list")
def get_brand_list(
    db: Session = Depends(get_db),
):
    query = db.query(
        SalesFact.brand,
    ).distinct()

    rows = query.order_by(SalesFact.brand).all()

    return {
        "data": [r.brand for r in rows]
    }

@app.get("/product/list")
def get_product_list(
    db: Session = Depends(get_db),
    store: str = Query(..., description="Store ID to filter by"),
    category: str = Query(..., description="Category to filter by"),
    brand: str = Query(..., description="Brand to filter by"),
):
    query = db.query(
        SalesFact.sku_id,
        SalesFact.sku_name,
        SalesFact.list_price
    ).distinct()

    if store:
        query = query.filter(SalesFact.store_id == store)
    if category:
        query = query.filter(SalesFact.category == category)
    if brand:
        query = query.filter(SalesFact.brand == brand)

    rows = query.order_by(SalesFact.sku_id).all()

    return {
        "data": [
            {"sku_id": r.sku_id, "sku_name": r.sku_name, "list_price": float(r.list_price)}
            for r in rows
        ]
    }