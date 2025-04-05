import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import MapMarkers from "./MapMarkers";
import { $bounds, updateBounds } from "../store/bounds";
import { $map } from "../store/map";
import MapSidebar from "./MapSidebar";

export default function Map() {
  return (
    <div>
      <MapContainer
        center={[40.41683738678185, -3.7032161997816497]}
        zoom={6}
        className="w-screen h-screen z-0"
        wheelPxPerZoomLevel={200}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          eventHandlers={{
            load: (e) => {
              if ($bounds.get().e === "0") {
                const map = e.target._map;
                $map.set(map);
                map.attributionControl.setPrefix("");
                updateBounds();
              }
            },
          }}
        />

        <MapMarkers />
      </MapContainer>
      <MapSidebar />
    </div>
  );
}
