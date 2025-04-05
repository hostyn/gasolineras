import {
  db,
  priceHistoryTable,
  Product,
  productsTable,
  Provider,
  stationsTable,
} from "@repo/database";
import { and, eq } from "drizzle-orm";

export const getProductFromDB = async (type: Product, name?: string) => {
  const realName =
    name ??
    (type === "diesel"
      ? "Diesel"
      : type === "gasoline"
        ? "Gasolina 95"
        : "Adblue");

  const productInDB = await db
    .select()
    .from(productsTable)
    .where(and(eq(productsTable.type, type), eq(productsTable.name, realName)));

  const [product] = productInDB[0]
    ? productInDB
    : await db
        .insert(productsTable)
        .values({
          name: realName,
          type: type,
        })
        .returning();

  return product;
};

export const upsertStation = async ({
  name,
  latitude,
  longitude,
  gobId,
  address,
  cityId,
  city,
  postalCode,
  provinceId,
  province,
  regionId,
  region,
  dead,
}: {
  name: string;
  longitude: number;
  latitude: number;
  gobId: number;
  address: string;
  cityId: number;
  city: string;
  provinceId: number;
  province: string;
  regionId: number;
  region: string;
  postalCode: string;
  dead?: boolean;
}) => {
  const provider = getProvider(name);

  const [stationInDB] = await db
    .insert(stationsTable)
    .values({
      name,
      location: { x: longitude, y: latitude },
      provider,
      gobId,
      address,
      cityId,
      city,
      provinceId,
      province,
      regionId,
      region,
      postalCode,
      dead,
    })
    .onConflictDoUpdate({
      target: [stationsTable.gobId],
      setWhere: eq(stationsTable.priceProvider, "gob"),
      set: {
        name,
        location: { x: longitude, y: latitude },
        address,
        cityId,
        city,
        provinceId,
        province,
        regionId,
        region,
        postalCode,
        provider,
        dead,
      },
    })
    .returning();

  return stationInDB;
};

export const upsertPrice = async ({
  stationId,
  productId,
  price,
  date,
}: {
  stationId: number;
  productId: number;
  price: string;
  date?: string;
}) => {
  await db
    .insert(priceHistoryTable)
    .values({
      stationId,
      productId,
      price,
      date,
    })
    .onConflictDoUpdate({
      target: [
        priceHistoryTable.stationId,
        priceHistoryTable.productId,
        priceHistoryTable.date,
      ],
      set: {
        price,
      },
    });
};

const getProvider = (provider: string): Provider => {
  if (provider.toLowerCase().includes("plenergy")) return "plenergy";
  if (provider.toLowerCase().includes("plenoil")) return "plenergy";
  if (provider.toLowerCase().includes("petroprix")) return "petroprix";
  if (provider.toLowerCase().includes("shell")) return "shell";
  if (provider.toLowerCase().includes("alcampo")) return "alcampo";
  if (provider.toLowerCase().includes("cepsa")) return "cepsa";
  if (provider.toLowerCase().includes("carrefour")) return "carrefour";
  if (provider.toLowerCase().includes("repsol")) return "repsol";
  if (provider.toLowerCase().includes("moeve")) return "moeve";
  if (provider.toLowerCase().includes("bp")) return "bp";
  if (provider.toLowerCase().includes("galp")) return "galp";

  return "other";
};

export const titleCase = (str: string) => {
  var splitStr = str.toLowerCase().split(" ");
  for (var i = 0; i < splitStr.length; i++) {
    if (splitStr[i].charAt(0) === "(") {
      splitStr[i] =
        "(" + splitStr[i].charAt(1).toUpperCase() + splitStr[i].substring(2);
      continue;
    }
    splitStr[i] =
      splitStr[i].charAt(0).toUpperCase() + splitStr[i].substring(1);
  }
  return splitStr.join(" ");
};
