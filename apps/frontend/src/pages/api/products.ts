import { db, productsTable } from "@repo/database";
import type { APIRoute } from "astro";
import { type InferSelectModel } from "drizzle-orm";

export const prerender = false;

export type ProductsResponse = InferSelectModel<typeof productsTable>[];

export const GET: APIRoute = async ({ url }) => {
  const products = await db.select().from(productsTable);

  return new Response(JSON.stringify(products), {
    headers: {
      "content-type": "application/json",
    },
  });
};
