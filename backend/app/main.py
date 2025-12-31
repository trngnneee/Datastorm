from fastapi import FastAPI, Query, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from .model.sales_fact import SalesFact
from .utils.db import get_db
from fastapi.middleware.cors import CORSMiddleware

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

@app.get("/net_sales/{country}/daily")
def get_net_sales(
    country: str,
    db: Session = Depends(get_db),
    year: str = Query("all", description="Filter by year, use 'all' for no filter")
):
    query = db.query(
        SalesFact.date,
        func.sum(SalesFact.net_sales).label("net_sales")
    ).filter(SalesFact.country == country)

    yearList = db.query(func.extract("year", SalesFact.date).distinct()).order_by(func.extract("year", SalesFact.date)).all()

    if year != "all":
        query = query.filter(func.extract("year", SalesFact.date) == int(year))

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