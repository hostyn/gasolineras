import { atom } from "nanostores";
import { $map } from "./map";

export const $bounds = atom({
  n: "0",
  w: "0",
  s: "0",
  e: "0",
});

export const updateBounds = () => {
  const map = $map.get();
  if (map == null) return;

  const bounds = map.getBounds();

  const windowWidth = window.innerWidth;
  const mapSidebarLocation =
    windowWidth >= 768
      ? map.containerPointToLatLng([400, 0])
      : map.containerPointToLatLng([0, 0]);

  $bounds.set({
    n: mapSidebarLocation.lat.toString(),
    w: mapSidebarLocation.lng.toString(),
    s: bounds.getSouth().toString(),
    e: bounds.getEast().toString(),
  });
};
