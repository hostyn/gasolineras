import { atom } from "nanostores";

const getProduct = () => {
  const local = localStorage.getItem("selected_product");
  if (local === null) return 6;
  const parsed = parseInt(local);
  if (isNaN(parsed)) return 6;
  return parsed;
};

export const $product = atom<number>(getProduct());

$product.subscribe((product) => {
  localStorage.setItem("selected_product", product.toString());
});
