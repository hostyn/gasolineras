import {
  integer,
  pgTable,
  text,
  numeric,
  pgEnum,
  date,
  unique,
  geometry,
  boolean,
} from "drizzle-orm/pg-core";

export const providerEnum = pgEnum("provider", [
  "plenergy",
  "petroprix",
  "shell",
  "cepsa",
  "repsol",
  "bp",
  "carrefour",
  "alcampo",
  "moeve",
  "galp",
  "other",
]);

export type Provider = (typeof providerEnum.enumValues)[number];

export const priceProviderEnum = pgEnum("price_provider", [
  "gob",
  "plenergy",
  "petroprix",
]);

export type PriceProvider = (typeof priceProviderEnum.enumValues)[number];

export const stationsTable = pgTable("stations", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: text().notNull(),
  location: geometry({ type: "point", srid: 4326, mode: "xy" }).notNull(),
  provider: providerEnum().notNull().default("other"),
  priceProvider: priceProviderEnum("price_provider").notNull().default("gob"),
  priceProviderId: text("price_provider_id").unique(),
  gobId: integer("gob_id").notNull().unique(),
  dead: boolean().notNull().default(false),
  address: text().notNull(),
  cityId: integer("city_id")
    .notNull()
    .references(() => citiesTable.id),
  city: text().notNull(),
  provinceId: integer("province_id")
    .notNull()
    .references(() => provincesTable.id),
  province: text().notNull(),
  regionId: integer("region_id")
    .notNull()
    .references(() => regionsTable.id),
  region: text().notNull(),
  postalCode: text("postal_code").notNull(),
});

export const productTypeEnum = pgEnum("product_type", [
  "gasoline",
  "diesel",
  "other",
]);
export type Product = (typeof productTypeEnum.enumValues)[number];

export const productsTable = pgTable("products", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: text().notNull(),
  type: productTypeEnum().notNull(),
});

export const priceHistoryTable = pgTable(
  "price_history",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    stationId: integer("station_id")
      .notNull()
      .references(() => stationsTable.id),
    productId: integer("product_id")
      .notNull()
      .references(() => productsTable.id),
    price: numeric({ precision: 5, scale: 3 }).notNull(),
    date: date().notNull().defaultNow(),
  },
  (table) => [unique().on(table.stationId, table.productId, table.date)]
);

export const regionsTable = pgTable("regions", {
  id: integer().primaryKey(),
  name: text().notNull(),
});

export const provincesTable = pgTable("provinces", {
  id: integer().primaryKey(),
  name: text().notNull(),
  regionId: integer("region_id")
    .notNull()
    .references(() => regionsTable.id),
});

export const citiesTable = pgTable("cities", {
  id: integer().primaryKey(),
  name: text().notNull(),
  provinceId: integer("province_id")
    .notNull()
    .references(() => provincesTable.id),
});
