import { useStore } from "@nanostores/react";
import { $bounds } from "../store/bounds";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getMap } from "../services/backend";
import { queryClient } from "../store/queryClient";
import { $map } from "../store/map";
import { getStationProviderIcon } from "../services/util";
import { $product } from "../store/product";
import { $selectedStation } from "../store/selectedStation";
import { ProductSelect } from "./ProductSelect";

export default function MapSidebar() {
  const map = useStore($map);
  const bounds = useStore($bounds);
  const selectedProduct = useStore($product);
  const selectedStation = useStore($selectedStation);

  const { data: stations } = useQuery(
    {
      queryKey: [
        "map",
        bounds.n,
        bounds.e,
        bounds.s,
        bounds.w,
        selectedProduct,
      ],
      queryFn: () =>
        getMap({
          bounds,
          product: selectedProduct,
        }),
      placeholderData: keepPreviousData,
    },
    queryClient
  );

  return (
    <div className="absolute top-0 left-0 flex flex-col bg-white w-sm max-h-[calc(100vh-var(--spacing)*8)] h-screen m-4 p-4 rounded gap-2">
      <ProductSelect />

      <div
        className="flex flex-col overflow-y-auto"
        style={{ scrollbarGutter: "stable" }}
      >
        {stations?.results.map((station) => (
          <button
            onClick={() => {
              // TODO: Centrar la gasolinera en el mapa
              map?.flyTo([station.location.y, station.location.x], 13, {
                duration: 1,
              });
              $selectedStation.set(station.id);
            }}
            onDoubleClick={() => {
              map?.flyTo([station.location.y, station.location.x], 17, {
                duration: 1,
              });
            }}
            key={station.id}
            aria-selected={station.id === selectedStation}
            className="flex text-left gap-2 hover:bg-slate-200 p-2 rounded-lg cursor-pointer aria-selected:bg-slate-300"
          >
            <div className="size-8 rounded-full overflow-hidden min-w-8 min-h-8">
              {getStationProviderIcon(station.provider)}
            </div>
            <div className="flex justify-between w-full">
              <div className="flex flex-col">
                <span className="font-medium tracking-tight text-slate-800">
                  {station.name}
                </span>
                <span className="text-xs text-slate-700">
                  {station.address}, {station.city}, {station.province}
                </span>
              </div>
              <span
                className="rounded h-fit p-1 text-white text-sm font-bold"
                style={{
                  backgroundColor: `hsl(${stations.maxPrice - stations.minPrice == 0 ? 128 : (1 - (Number(station.price) - stations.minPrice) / (stations.maxPrice - stations.minPrice)) * 128}, 50%, 55%)`,
                }}
              >
                {Intl.NumberFormat("es-ES", {
                  style: "currency",
                  currency: "EUR",
                  minimumFractionDigits: 3,
                }).format(Number(station.price))}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
