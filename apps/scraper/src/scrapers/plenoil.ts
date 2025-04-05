import { db, priceHistoryTable, stationsTable } from "@repo/database";
import { getProductFromDB, upsertPrice, upsertStation } from "../util";
import { and, eq, sql } from "drizzle-orm";
import moment from "moment";

export const scrapePlenoil = async () => {
  const diesel = await getProductFromDB("diesel", "Gasoleo A");
  const gasoline = await getProductFromDB("gasoline", "Gasolina 95 E5");

  const now = moment();

  console.time("✅ Plenoil stations fetched");
  const stationsRes = await fetch(
    "https://plenoil.es/estaciones_datos/json.php"
  );
  const stations = (await stationsRes.json()) as PlenoilStation[];

  const stationPricesRes = await fetch(
    "https://plenoil.es/nuestras-gasolineras/"
  );
  const stationPricesHTML = await stationPricesRes.text();

  const stationPricesJSON = stationPricesHTML.match(
    /datosPrecio=(.+);<\/script>/
  );
  const stationPrices = JSON.parse(stationPricesJSON?.[1] ?? "") as Record<
    string,
    PlenoilStationPrices
  >;
  console.timeEnd("✅ Plenoil stations fetched");

  console.time("✅ Plenoil stations parsed and inserted");

  const stationsWithPrice = stations
    .map((station) => ({
      ...station,
      price: stationPrices[station.idalvic],
    }))
    .filter(
      (station) =>
        station.longitud != null &&
        station.latitud != null &&
        ["PLENOIL", "PLENOIL Canarias"].includes(station.company)
    );

  for (const station of stationsWithPrice) {
    const matchingStation = await getMatchingStation(station);

    await Promise.all([
      upsertPrice({
        stationId: matchingStation.id,
        productId: diesel.id,
        price: String(station.price.diesel),
        date: now.format("YYYY-MM-DD"),
      }),

      upsertPrice({
        stationId: matchingStation.id,
        productId: gasoline.id,
        price: String(station.price.splomo),
        date: now.format("YYYY-MM-DD"),
      }),
    ]);
  }

  console.timeEnd("✅ Plenoil stations parsed and inserted");
};

const getMatchingStation = async (station: PlenoilStation) => {
  const [matchingStation] = await db
    .select()
    .from(stationsTable)
    .where(eq(stationsTable.priceProviderId, `plenergy-${station.idalvic}`));

  if (matchingStation != null) return matchingStation;

  const [matchingStationByGeolocation] = await db
    .select({
      id: stationsTable.id,
      address: stationsTable.address,
      distance:
        sql<number>`ST_Distance(${stationsTable.location}::geography, 'SRID=4326;POINT(${sql.raw(station.longitud)} ${sql.raw(station.latitud)})'::geography)`.as(
          "distance"
        ),
    })
    .from(stationsTable)
    .where(eq(stationsTable.provider, "plenergy"))
    .orderBy(sql`distance`)
    .limit(1);

  const [updatedMatchingStation] = await db
    .update(stationsTable)
    .set({
      name: "Plenergy " + station.nombreweb,
      address: station.direccion,
      priceProvider: "plenergy",
      priceProviderId: `plenergy-${station.idalvic}`,
      location: { x: Number(station.longitud), y: Number(station.latitud) },
    })
    .where(eq(stationsTable.id, matchingStationByGeolocation.id))
    .returning();

  return updatedMatchingStation;
};

interface PlenoilStation {
  id: string;
  idalvic: string;
  nombre: string;
  nombreweb: string;
  slug: string;
  direccion: string;
  cpostal: string;
  poblacion: string;
  provincia: string;
  longitud: string;
  latitud: string;
  urlweb: string;
  surtidores: string;
  lavaderos: string;
  aspiradores: string;
  cargadores: string;
  aireagua: string;
  horario1_es: string;
  horario2_es: string;
  horario1_en: string;
  horario2_en: string;
  horario1_ca: string;
  horario2_ca: string;
  horario1_pt: string;
  horario2_pt: string;
  horario1_eu: string;
  horario2_eu: string;
  preciariolavadero: string;
  es24h: "1" | "0";
  company: string;
  observaciones: string;
  ceco: string;
  url_gmb: string;
  apertura: string;
}

interface PlenoilStationPrices {
  diesel: string;
  splomo: string;
  AdBlue?: string;
}
