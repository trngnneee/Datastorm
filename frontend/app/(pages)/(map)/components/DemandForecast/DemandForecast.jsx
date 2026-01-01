"use client"

import { Title } from "./../Title"
import { Filter, Grid2X2, Package, ShoppingCart, Store } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceArea,
  Legend,
} from "recharts";

export const DemandForecast = () => {
  const [storeList, setStoreList] = useState([]);
  const [categoryList, setCategoryList] = useState([]);
  const [brandList, setBrandList] = useState([]);
  const [oldUnitSoldData, setOldUnitSoldData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/store/list`)
        .then((res) => res.json())
        .then((data) => {
          setStoreList(data.data);
        })
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/category/list`)
        .then((res) => res.json())
        .then((data) => {
          setCategoryList(data.data);
        });
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/brand/list`)
        .then((res) => res.json())
        .then((data) => {
          setBrandList(data.data);
        });
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/unit_sold/daily?country=all&year=2023&month=12`)
        .then((res) => res.json())
        .then((data) => {
          setOldUnitSoldData(data.data);
        });
    };
    fetchData();
  }, []);

  const [selectedStore, setSelectedStore] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");

  const [productList, setProductList] = useState([]);
  useEffect(() => {
    if (selectedStore && selectedCategory && selectedBrand) {
      const fetchProductList = async () => {
        let queryParams = [];
        if (selectedStore) {
          queryParams.push(`store=${encodeURIComponent(selectedStore)}`);
        }
        if (selectedCategory) {
          queryParams.push(`category=${encodeURIComponent(selectedCategory)}`);
        }
        if (selectedBrand) {
          queryParams.push(`brand=${encodeURIComponent(selectedBrand)}`);
        }
        const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/product/list${queryString}`)
          .then((res) => res.json())
          .then((data) => {
            setProductList(data.data);
          });
      };
      fetchProductList();
    }
  }, [selectedStore, selectedCategory, selectedBrand]);

  const fixParameter = {
    temperature: 30.5,
    discount_pct: 0.0,
    promo_flag: 0,
  }

  const mergedData = oldUnitSoldData.map(item => ({
    date: item.date,
    unit_sold: item.units_sold || 0,
  }));

  return (
    <>
      <Title text="Demand Forecast" className={"mt-10"} />
      <div className="bg-white p-5 rounded-md shadow-md border border-gray-300 w-full mt-5">
        <div className="flex items-center gap-5 text-[20px] mb-10">
          <Filter />
          <span>Filter</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="w-full">
            <Label
              htmlFor="store-select"
              className="flex items-center gap-3 text-[16px] mb-2"
            >
              <Store size={14} />
              Store ID
            </Label>
            <Select
              value={selectedStore}
              onValueChange={setSelectedStore}
              className="mb-4"
              id="store-select"
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select store" />
              </SelectTrigger>

              <SelectContent>
                {Array.isArray(storeList)
                  ? storeList.map((store) => (
                    <SelectItem key={store} value={store}>
                      {store}
                    </SelectItem>
                  ))
                  : null}
              </SelectContent>
            </Select>
          </div>
          <div className="w-full">
            <Label
              htmlFor="category-select"
              className="flex items-center gap-3 text-[16px] mb-2"
            >
              <Grid2X2 size={14} />
              Category
            </Label>
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
              className="mb-4"
              id="category-select"
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>

              <SelectContent>
                {Array.isArray(categoryList)
                  ? categoryList.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))
                  : null}
              </SelectContent>
            </Select>
          </div>
          <div className="w-full">
            <Label
              htmlFor="brand-select"
              className="flex items-center gap-3 text-[16px] mb-2"
            >
              <ShoppingCart size={14} />
              Brand
            </Label>
            <Select
              value={selectedBrand}
              onValueChange={setSelectedBrand}
              className="mb-4"
              id="brand-select"
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select brand" />
              </SelectTrigger>

              <SelectContent>
                {Array.isArray(brandList)
                  ? brandList.map((brand) => (
                    <SelectItem key={brand} value={brand}>
                      {brand}
                    </SelectItem>
                  ))
                  : null}
              </SelectContent>
            </Select>
          </div>
          <div className="w-full">
            <Label
              htmlFor="product-select"
              className="flex items-center gap-3 text-[16px] mb-2"
            >
              <Package size={14} />
              Product
            </Label>
            <Select
              value={selectedProduct}
              onValueChange={setSelectedProduct}
              className="mb-4"
              id="product-select"
              disabled={productList.length === 0}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select product" />
              </SelectTrigger>

              <SelectContent>
                {Array.isArray(productList)
                  ? productList.map((product, index) => (
                    <SelectItem key={index} value={product.sku_id}>
                      {product.sku_name}
                    </SelectItem>
                  ))
                  : null}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      <div className="bg-white p-5 rounded-md shadow-md border border-gray-300 w-full h-full mt-10">
        <div className="text-center text-xl mb-3">
          Unit Sold Forecase 12/2023 and 7 Days Prediction
        </div>
        <div className="text-center text-[12px] mb-3">
          <span className="font-bold">Store:</span> {selectedStore || "All Stores"} - <span className="font-bold">Category:</span> {selectedCategory || "All Categories"} - <span className="font-bold">Brand:</span> {selectedBrand || "All Brands"} - <span className="font-bold">Product:</span> {selectedProduct || "All Products"}
        </div>

        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={mergedData} barCategoryGap="2">
            <CartesianGrid strokeDasharray="3 3" />

            <XAxis dataKey="date" tick={{ fontSize: 12 }} minTickGap={20} />
            <YAxis tick={{ fontSize: 12 }} />

            <Tooltip />

            <Bar
              dataKey="unit_sold"
              fill="#f59e0b"
              radius={[4, 4, 0, 0]}
              barSize={14}
            />

            <Legend verticalAlign="bottom" align="center" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </>
  )
}