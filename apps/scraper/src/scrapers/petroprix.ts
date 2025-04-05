import { db, priceHistoryTable, stationsTable } from "@repo/database";
import { getProductFromDB, upsertPrice, upsertStation } from "../util";
import { and, eq, sql } from "drizzle-orm";
import moment from "moment";

export const scrapePetroprix = async () => {
  const diesel = await getProductFromDB("diesel", "Gasoleo A");
  const gasoline = await getProductFromDB("gasoline", "Gasolina 95 E5");

  const now = moment();

  console.time("✅ Petroprix stations fetched");
  const stationsRes = await fetch(
    "https://hzd98p8bnb.execute-api.eu-west-1.amazonaws.com/api/gasstations",
    {
      headers: {
        "X-Api-Key": "4AEW8JTpkaaDqK140G9jK4mWNY9z4iBE9wG3bOoc",
      },
    }
  );

  const { msg: unfilteredStations } =
    (await stationsRes.json()) as PetroprixStationsResponse;
  console.timeEnd("✅ Petroprix stations fetched");

  console.time("✅ Petroprix stations parsed and inserted");

  const stations = unfilteredStations.filter(
    (station) => station.tipo_gas === 0 && station.privada == "0"
  );

  for (const station of stations) {
    const matchingStation = await getMatchingStation(station);
    if (matchingStation == null) continue;

    await Promise.all([
      upsertPrice({
        stationId: matchingStation.id,
        productId: diesel.id,
        price: String(station.p_diesel),
        date: now.format("YYYY-MM-DD"),
      }),

      upsertPrice({
        stationId: matchingStation.id,
        productId: gasoline.id,
        price: String(station.p_gasolina),
        date: now.format("YYYY-MM-DD"),
      }),
    ]);
  }
  console.timeEnd("✅ Petroprix stations parsed and inserted");
};

const getMatchingStation = async (station: PetroprixStation) => {
  const [matchingStation] = await db
    .select()
    .from(stationsTable)
    .where(eq(stationsTable.priceProviderId, `petroprix-${station.id_gas}`))
    .limit(1);

  if (matchingStation != null) return matchingStation;

  if (station.id_gas === 175) {
    const [matchingStation] = await db
      .select()
      .from(stationsTable)
      .where(eq(stationsTable.gobId, 546))
      .limit(1);
    const [updatedMatchingStation] = await db
      .update(stationsTable)
      .set({
        name: "Petroprix " + station.nombre,
        address: station.direccion,
        priceProvider: "petroprix",
        priceProviderId: `petroprix-${station.id_gas}`,
      })
      .where(eq(stationsTable.id, matchingStation.id))
      .returning();
    return updatedMatchingStation;
  }

  const matchingStationByGobId = await getMatchingStationByGobId(station);
  if (matchingStationByGobId != null) return matchingStationByGobId;

  return await getMatchingStationByGeolocation(station);
};

const getMatchingStationByGobId = async (station: PetroprixStation) => {
  const [matchingStationByGobId] = await db
    .select()
    .from(stationsTable)
    .where(eq(stationsTable.gobId, Number(station.ideess_ministerio)))
    .limit(1);

  if (matchingStationByGobId == null) return null;

  const [updatedMatchingStation] = await db
    .update(stationsTable)
    .set({
      name: "Petroprix " + station.nombre,
      address: station.direccion,
      priceProvider: "petroprix",
      priceProviderId: `petroprix-${station.id_gas}`,
      location: { x: station.lon, y: station.lat },
    })
    .where(eq(stationsTable.id, matchingStationByGobId.id))
    .returning();

  return updatedMatchingStation;
};

const getMatchingStationByGeolocation = async (station: PetroprixStation) => {
  const [matchingStationByGeolocation] = await db
    .select({
      id: stationsTable.id,
      address: stationsTable.address,
      distance:
        sql<number>`ST_Distance(${stationsTable.location}::geography, 'SRID=4326;POINT(${sql.raw(station.lon.toString())} ${sql.raw(station.lat.toString())})'::geography)`.as(
          "distance"
        ),
    })
    .from(stationsTable)
    .where(
      and(
        eq(stationsTable.provider, "petroprix"),
        eq(stationsTable.priceProvider, "gob")
      )
    )
    .orderBy(sql`distance`)
    .limit(1);

  if (matchingStationByGeolocation == null) return null;
  if (matchingStationByGeolocation.distance > 150) return null;

  const [updatedMatchingStation] = await db
    .update(stationsTable)
    .set({
      name: "Petroprix " + station.nombre,
      address: station.direccion,
      priceProvider: "petroprix",
      priceProviderId: `petroprix-${station.id_gas}`,
      location: { x: station.lon, y: station.lat },
    })
    .where(eq(stationsTable.id, matchingStationByGeolocation.id))
    .returning();

  return updatedMatchingStation;
};

interface PetroprixStationsResponse {
  cod: number;
  msg: PetroprixStation[];
  statusDescription: string;
}

interface PetroprixStation {
  id_gas: number;
  nombre: string;
  lat: number;
  lon: number;
  localidad: string;
  provincia: string;
  direccion: string;
  cp: string;
  idccaa_ministerio: string;
  ideess_ministerio: string;
  p_diesel: number;
  p_gasolina: number;
  privada: string;
  imagen: string;
  url_web: string;
  tipo_gas: number;
  subvencion_solax: string;
  telefono: string;
}
