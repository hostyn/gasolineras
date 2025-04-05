import type { MapResponse } from "../pages/api/map";
import type { ProductsResponse } from "../pages/api/products";

export const getMap = async ({
  bounds,
  product,
}: {
  bounds: { n: string; w: string; s: string; e: string };
  product: number;
}) => {
  const mapRes = await fetch(
    "/api/map?" +
      new URLSearchParams({
        ...bounds,
        product: product.toString(),
      })
  );

  const mapData = (await mapRes.json()) as MapResponse;
  return mapData;
};

export const getProducts = async () => {
  const productsRes = await fetch("/api/products");
  const products = (await productsRes.json()) as ProductsResponse;
  return products;
};
