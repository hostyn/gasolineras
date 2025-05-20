import { useStore } from "@nanostores/react";
import { useRef, useState } from "react";
import { Sheet, type SheetRef } from "react-modal-sheet";
import { $selectedStation } from "../store/selectedStation";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { $bounds } from "../store/bounds";
import { $product } from "../store/product";
import { getMap } from "../services/backend";
import { queryClient } from "../store/queryClient";
import { $map } from "../store/map";
import { getStationProviderIcon } from "../services/util";

export default function MapModalSheet() {
  const selectedStation = useStore($selectedStation);
  const selectedProduct = useStore($product);
  const bounds = useStore($bounds);
  const map = useStore($map);

  const [currentSnap, setCurrentSnap] = useState(0);
  const ref = useRef<SheetRef>(null);
  const containerRef = useRef(null);
  const snapTo = (i: number) => ref.current?.snapTo(i);

  $selectedStation.listen((selectedStation) => {
    const sheet = document.getElementById("sheet");
    const comp = window.getComputedStyle(sheet!);

    if (comp.display !== "block") return;

    if (currentSnap === 1 && selectedStation == null) {
      snapTo(2);
    }

    if (currentSnap === 2 && selectedStation != null) {
      setTimeout(() => snapTo(1), 1);
    }
  });

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

  const selectedStationData = stations?.results.find(
    (station) => station.id === selectedStation
  );

  return (
    <Sheet
      id="sheet"
      ref={ref}
      isOpen={true}
      onClose={() =>
        currentSnap === 0 && selectedStation != null ? snapTo(1) : snapTo(2)
      }
      snapPoints={selectedStation == null ? [1, 40, 40] : [1, 112, 40]}
      initialSnap={2}
      onSnap={setCurrentSnap}
      dragVelocityThreshold={200}
      className="md:hidden"
    >
      <Sheet.Container>
        <Sheet.Header />
        <Sheet.Content>
          {selectedStationData && stations && (
            <button
              onClick={() => {
                // TODO: Centrar la gasolinera en el mapa
                map?.flyTo(
                  [
                    selectedStationData.location.y,
                    selectedStationData.location.x,
                  ],
                  13,
                  {
                    duration: 1,
                  }
                );
                $selectedStation.set(selectedStationData.id);
              }}
              onDoubleClick={() => {
                map?.flyTo(
                  [
                    selectedStationData.location.y,
                    selectedStationData.location.x,
                  ],
                  17,
                  {
                    duration: 1,
                  }
                );
              }}
              key={selectedStationData.id}
              aria-selected={selectedStationData.id === selectedStation}
              className={`flex text-left gap-2 hover:bg-slate-200 p-2 rounded-lg cursor-pointer ${currentSnap === 1 && "min-h-[72px] max-h-[72px]"}`}
            >
              <div className="size-8 rounded-full overflow-hidden min-w-8 min-h-8">
                {getStationProviderIcon(selectedStationData.provider)}
              </div>
              <div className="flex justify-between w-full">
                <div className="flex flex-col">
                  <span className="font-medium tracking-tight leading-tight text-slate-800">
                    {selectedStationData.name}
                  </span>
                  <span className="text-xs text-slate-700">
                    {selectedStationData.address}, {selectedStationData.city},{" "}
                    {selectedStationData.province}
                  </span>
                </div>
                <span
                  className="rounded h-fit p-1 text-white text-sm font-bold"
                  style={{
                    backgroundColor: `hsl(${stations.maxPrice - stations.minPrice == 0 ? 128 : (1 - (Number(selectedStationData.price) - stations.minPrice) / (stations.maxPrice - stations.minPrice)) * 128}, 50%, 55%)`,
                  }}
                >
                  {Intl.NumberFormat("es-ES", {
                    style: "currency",
                    currency: "EUR",
                    minimumFractionDigits: 3,
                  }).format(Number(selectedStationData.price))}
                </span>
              </div>
            </button>
          )}
          <h1 className="text-sm tracking-tight font-bold text-slate-600 px-2 pb-2">
            Gasolineras en la zona
          </h1>
          <Sheet.Scroller
            draggableAt="top"
            className="flex flex-col overflow-y-auto"
          >
            {stations?.results.map(
              (station) =>
                station.id != selectedStation && (
                  <button
                    onClick={() => {
                      // TODO: Centrar la gasolinera en el mapa
                      map?.closePopup();
                      map?.flyTo([station.location.y, station.location.x], 13, {
                        duration: 1,
                      });
                      $selectedStation.set(station.id);
                    }}
                    onDoubleClick={() => {
                      map?.closePopup();
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
                )
            )}
          </Sheet.Scroller>
        </Sheet.Content>
      </Sheet.Container>
    </Sheet>
  );
}
