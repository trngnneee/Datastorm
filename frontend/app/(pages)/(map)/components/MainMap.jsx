"use client";

import Map, { Layer, Source } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export const MainMap = () => {
  const [zoom, setZoom] = useState(3);

  const covidPoints = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: { cases: 5 },
        geometry: {
          type: "Point",
          coordinates: [13.39071, 52.52586],
        },
      },
      // {
      //   type: "Feature",
      //   properties: { cases: 10 },
      //   geometry: {
      //     type: "Point",
      //     coordinates: [205.84, 21.031],
      //   },
      // },
      // {
      //   type: "Feature",
      //   properties: { cases: 50 },
      //   geometry: {
      //     type: "Point",
      //     coordinates: [184.845, 21.028],
      //   },
      // },
    ],
  };

  return (
    <>
      <div className="absolute bottom-10 right-10 z-99">
        <Button className="bg-[#2B3674] hover:bg-[#1e2758be]" onClick={() => setZoom(3)}>Default zoom</Button>
      </div>
      <Map
        initialViewState={{
          longitude: 52.52586,
          latitude: 13.39071,
          zoom: zoom,
        }}
        style={{ width: "100%", height: "100%", borderBottom: "1px solid #ccc", backgroundColor: "#f5f5f5" }}
        projection="globe"
        mapStyle={`https://api.maptiler.com/maps/topo-v4/style.json?key=${process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}`}
        zoom={zoom}
        onZoom={(e) => setZoom(e.viewState.zoom)}
      >
        <Source id="area" type="geojson" data={covidPoints}>
          <Layer
            id="covid-heat"
            type="heatmap"
            paint={{
              // độ mạnh theo số ca
              "heatmap-weight": ["get", "cases"],

              // tăng độ lan khi zoom out
              "heatmap-intensity": [
                "interpolate",
                ["linear"],
                ["zoom"],
                10, 1,
                15, 3,
              ],

              // màu giống covid map
              "heatmap-color": [
                "interpolate",
                ["linear"],
                ["heatmap-density"],
                0, "rgba(0,0,255,0)",
                0.2, "blue",
                0.4, "cyan",
                0.6, "yellow",
                0.8, "orange",
                1, "red",
              ],

              "heatmap-radius": 30,
              "heatmap-opacity": 0.7,
            }}
          />
        </Source>
        <Source
          id="maptiler-v4"
          type="vector"
          url={`https://api.maptiler.com/tiles/v4/tiles.json?key=${process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}`}
        >
          <Layer
            id="road-overlay"
            type="line"
            source-layer="building"
            paint={{
              "line-color": "#000",
              "line-width": 0.2,
            }}
          />
        </Source>
      </Map>
    </>
  )
}