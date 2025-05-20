import { Marker, Popup, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { renderToString } from "react-dom/server";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getMap } from "../services/backend";
import { queryClient } from "../store/queryClient";
import { getStationProviderIcon } from "../services/util";
import { useStore } from "@nanostores/react";
import { $bounds, updateBounds } from "../store/bounds";
import { $product } from "../store/product";
import { $selectedStation } from "../store/selectedStation";

export default function MapMarkers() {
  const bounds = useStore($bounds);
  const product = useStore($product);
  const selectedStation = useStore($selectedStation);

  const map = useMapEvents({
    moveend: (e) => {
      updateBounds();
    },
    click: (e) => {
      $selectedStation.set(null);
    },
  });

  const { data: stations } = useQuery(
    {
      queryKey: ["map", bounds.n, bounds.e, bounds.s, bounds.w, product],
      queryFn: () =>
        getMap({
          bounds,
          product,
        }),
      placeholderData: keepPreviousData,
    },
    queryClient
  );

  return (
    <>
      {stations?.results.map((station) => (
        <Marker
          key={station.id}
          position={[station.location.y, station.location.x]}
          eventHandlers={{
            click: (e) => {
              $selectedStation.set(station.id);
            },
            dblclick: (e) => {
              map.flyTo([station.location.y, station.location.x], 13, {
                duration: 1,
              });
            },
          }}
          icon={L.divIcon({
            className: "bg-transparent",
            iconSize: [34, 48],
            iconAnchor: [17, 48],
            popupAnchor: [0, -60],
            html: renderToString(
              <div
                className={`${
                  selectedStation === station.id
                    ? "scale-125 -translate-y-1/8"
                    : ""
                } transition-all duration-1000`}
              >
                <div
                  className={
                    "absolute bg-slate-100 top-1 left-1 right-1 aspect-square rounded-full overflow-hidden"
                  }
                >
                  {getStationProviderIcon(station.provider)}
                </div>
                <svg width="34" height="48" viewBox="0 0 34 48" fill="none">
                  <path
                    d="M17 0C7.60753 0 0 7.61175 0 17C0 20.814 1.25566 24.3351 3.37697 27.1713L14.2813 46.0587C14.3446 46.1805 14.4079 46.3017 14.4857 46.4132L14.5098 46.4548L14.5164 46.4512C15.0734 47.2216 15.9698 47.7237 17.009 47.7237C17.947 47.7237 18.7644 47.2969 19.3269 46.6392L19.3552 46.6555L19.4631 46.4686C19.6222 46.254 19.7633 46.025 19.8652 45.7724L30.5483 27.2672C32.7136 24.414 34 20.858 34 17C34 7.61175 26.3925 0 17 0Z"
                    fill={`hsl(${stations.maxPrice - stations.minPrice == 0 ? 128 : (1 - (Number(station.price) - stations.minPrice) / (stations.maxPrice - stations.minPrice)) * 128}, 50%, 55%)`}
                  />
                </svg>
              </div>
            ),
          })}
        >
          <Popup>
            <span className="text-xs font-semibold tracking-tight text-slate-500">
              {station.name}
            </span>
            <br />
            <span
              className="text-sm tracking-tight font-semibold text-slate-800"
              style={{
                color: `hsl(${stations.maxPrice - stations.minPrice == 0 ? 128 : (1 - (Number(station.price) - stations.minPrice) / (stations.maxPrice - stations.minPrice)) * 128}, 50%, 40%)`,
              }}
            >
              {Intl.NumberFormat("es-ES", {
                style: "currency",
                currency: "EUR",
                minimumFractionDigits: 3,
              }).format(Number(station.price))}
            </span>
          </Popup>
        </Marker>
      ))}
    </>
  );
}
