CREATE TYPE "public"."price_provider" AS ENUM('gob', 'plenergy', 'petroprix');--> statement-breakpoint
CREATE TYPE "public"."product_type" AS ENUM('gasoline', 'diesel', 'other');--> statement-breakpoint
CREATE TYPE "public"."provider" AS ENUM('plenergy', 'petroprix', 'shell', 'cepsa', 'repsol', 'bp', 'carrefour', 'alcampo', 'moeve', 'galp', 'other');--> statement-breakpoint
CREATE TABLE "cities" (
	"id" integer PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"province_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "price_history" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "price_history_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"station_id" integer NOT NULL,
	"product_id" integer NOT NULL,
	"price" numeric(5, 3) NOT NULL,
	"date" date DEFAULT now() NOT NULL,
	CONSTRAINT "price_history_station_id_product_id_date_unique" UNIQUE("station_id","product_id","date")
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "products_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	"type" "product_type" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "provinces" (
	"id" integer PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"region_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "regions" (
	"id" integer PRIMARY KEY NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stations" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "stations_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	"location" geometry(point) NOT NULL,
	"provider" "provider" DEFAULT 'other' NOT NULL,
	"price_provider" "price_provider" DEFAULT 'gob' NOT NULL,
	"price_provider_id" text,
	"gob_id" integer NOT NULL,
	"dead" boolean DEFAULT false NOT NULL,
	"address" text NOT NULL,
	"city_id" integer NOT NULL,
	"city" text NOT NULL,
	"province_id" integer NOT NULL,
	"province" text NOT NULL,
	"region_id" integer NOT NULL,
	"region" text NOT NULL,
	"postal_code" text NOT NULL,
	CONSTRAINT "stations_price_provider_id_unique" UNIQUE("price_provider_id"),
	CONSTRAINT "stations_gob_id_unique" UNIQUE("gob_id")
);
--> statement-breakpoint
ALTER TABLE "cities" ADD CONSTRAINT "cities_province_id_provinces_id_fk" FOREIGN KEY ("province_id") REFERENCES "public"."provinces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_history" ADD CONSTRAINT "price_history_station_id_stations_id_fk" FOREIGN KEY ("station_id") REFERENCES "public"."stations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_history" ADD CONSTRAINT "price_history_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provinces" ADD CONSTRAINT "provinces_region_id_regions_id_fk" FOREIGN KEY ("region_id") REFERENCES "public"."regions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stations" ADD CONSTRAINT "stations_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stations" ADD CONSTRAINT "stations_province_id_provinces_id_fk" FOREIGN KEY ("province_id") REFERENCES "public"."provinces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stations" ADD CONSTRAINT "stations_region_id_regions_id_fk" FOREIGN KEY ("region_id") REFERENCES "public"."regions"("id") ON DELETE no action ON UPDATE no action;