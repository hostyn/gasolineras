import {
  citiesTable,
  db,
  priceHistoryTable,
  provincesTable,
  stationsTable,
  type Provider,
} from "@repo/database";
import type { APIRoute } from "astro";
import { and, desc, eq, sql } from "drizzle-orm";

export const prerender = false;

export type MapResponse = {
  results: {
    id: number;
    name: string;
    location: {
      x: number;
      y: number;
    };
    provider: Provider;
    price: string;
    address: string;
    city: string;
    region: string;
    province: string;
  }[];
  minPrice: number;
  maxPrice: number;
};

export const GET: APIRoute = async ({ url }) => {
  const productId = url.searchParams.get("product");

  const n = url.searchParams.get("n");
  const e = url.searchParams.get("e");
  const s = url.searchParams.get("s");
  const w = url.searchParams.get("w");

  const north = sql.raw(String(n));
  const east = sql.raw(String(e));
  const south = sql.raw(String(s));
  const west = sql.raw(String(w));

  const results = await db
    .select({
      id: stationsTable.id,
      name: stationsTable.name,
      location: stationsTable.location,
      provider: stationsTable.provider,
      price: priceHistoryTable.price,
      address: stationsTable.address,
      city: stationsTable.city,
      region: stationsTable.region,
      province: stationsTable.province,
    })
    .from(stationsTable)
    .innerJoin(
      priceHistoryTable,
      eq(stationsTable.id, priceHistoryTable.stationId)
    )
    .where(
      and(
        eq(priceHistoryTable.productId, Number(productId)),
        eq(
          priceHistoryTable.date,
          db
            .select({ date: priceHistoryTable.date })
            .from(priceHistoryTable)
            .orderBy(desc(priceHistoryTable.date))
            .limit(1)
        ),
        eq(stationsTable.dead, false),
        sql`ST_DWithin(${stationsTable.location}::geography, 'SRID=4326;POLYGON((${west} ${north}, ${east} ${north}, ${east} ${south}, ${west} ${south}, ${west} ${north}))'::geography, 0) = true`
      )
    )
    .orderBy(priceHistoryTable.price)
    .limit(50);

  return new Response(
    JSON.stringify({
      results,
      minPrice: results.at(0)?.price,
      maxPrice: results.at(-1)?.price,
    }),
    {
      headers: {
        "content-type": "application/json",
      },
    }
  );
};
