import { citiesTable, db, provincesTable, regionsTable } from "@repo/database";
import {
  getProductFromDB,
  titleCase,
  upsertPrice,
  upsertStation,
} from "../util";
import moment from "moment";
import { InferInsertModel } from "drizzle-orm";

export const scrapeGob = async () => {
  const products = [
    {
      name: "Precio Biodiesel",
      product: await getProductFromDB("other", "Biodiesel"),
    },
    {
      name: "Precio Bioetanol",
      product: await getProductFromDB("other", "Bioetanol"),
    },
    {
      name: "Precio Gas Natural Comprimido",
      product: await getProductFromDB("other", "Gas Natural Comprimido"),
    },
    {
      name: "Precio Gas Natural Licuado",
      product: await getProductFromDB("other", "Gas Natural Licuado"),
    },
    {
      name: "Precio Gases licuados del petróleo",
      product: await getProductFromDB("other", "Gases licuados del petróleo"),
    },
    {
      name: "Precio Gasoleo A",
      product: await getProductFromDB("diesel", "Gasoleo A"),
    },
    {
      name: "Precio Gasoleo B",
      product: await getProductFromDB("diesel", "Gasoleo B"),
    },
    {
      name: "Precio Gasoleo Premium",
      product: await getProductFromDB("diesel", "Gasoleo Premium"),
    },
    {
      name: "Precio Gasolina 95 E10",
      product: await getProductFromDB("gasoline", "Gasolina 95 E10"),
    },
    {
      name: "Precio Gasolina 95 E5",
      product: await getProductFromDB("gasoline", "Gasolina 95 E5"),
    },
    {
      name: "Precio Gasolina 95 E5 Premium",
      product: await getProductFromDB("gasoline", "Gasolina 95 E5 Premium"),
    },
    {
      name: "Precio Gasolina 98 E10",
      product: await getProductFromDB("gasoline", "Gasolina 98 E10"),
    },
    {
      name: "Precio Gasolina 98 E5",
      product: await getProductFromDB("gasoline", "Gasolina 98 E5"),
    },
    {
      name: "Precio Hidrogeno",
      product: await getProductFromDB("other", "Hidrogeno"),
    },
  ];

  console.time("✅ Gob locations fetched");
  await seedLocations();
  console.timeEnd("✅ Gob locations fetched");

  console.time("✅ Gob stations fetched");
  const gobRes = await fetch(
    "https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes/EstacionesTerrestres/",
    {
      headers: {
        Accept: "application/json",
      },
    }
  );
  const stations = (await gobRes.json()) as GobResponse;
  console.timeEnd("✅ Gob stations fetched");

  console.time("✅ Gob stations parsed and inserted");

  const date = moment(stations.Fecha, "DD/MM/YYYY HH:mm:ss");

  const regions = await db.select().from(regionsTable);
  const regionsIndex = regions.reduce(
    (acc, province) => {
      acc[province.id] = province.name;
      return acc;
    },
    {} as Record<number, string>
  );

  for (const station of stations.ListaEESSPrecio) {
    if (station["Tipo Venta"] !== "P") continue;

    const updatedStation = await upsertStation({
      name: station["Rótulo"],
      latitude: parseFloat(station.Latitud.replace(",", ".")),
      longitude: parseFloat(station["Longitud (WGS84)"].replace(",", ".")),
      gobId: parseInt(station.IDEESS),
      address: station["Dirección"],
      cityId: parseInt(station.IDMunicipio),
      postalCode: station["C.P."],
      provinceId: parseInt(station.IDProvincia),
      regionId: parseInt(station.IDCCAA),
      city: station.Municipio,
      province: titleCase(station.Provincia),
      region: regionsIndex[Number(station.IDCCAA)],
      dead:
        station["Rótulo"] === "-" ||
        station["Rótulo"] === "NINGUNO" ||
        (parseFloat(station.Latitud.replace(",", ".")) === 0 &&
          parseFloat(station["Longitud (WGS84)"].replace(",", ".")) === 0),
    });

    if (updatedStation == null) continue;

    for (const product of products) {
      if (station[product.name as keyof Station] !== "") {
        upsertPrice({
          stationId: updatedStation.id,
          productId: product.product.id,
          price: station[product.name as keyof Station].replace(",", "."),
          date: date.format("YYYY-MM-DD"),
        });
      }
    }
  }
  console.timeEnd("✅ Gob stations parsed and inserted");
};

const seedLocations = async () => {
  const regionsRes = await fetch(
    "https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes/Listados/ComunidadesAutonomas/",
    {
      headers: {
        Accept: "application/json",
      },
    }
  );
  if (!regionsRes.ok) {
    throw new Error("Failed to fetch regions");
  }
  const regions = (await regionsRes.json()) as RegionRes[];

  const regionsInsert: InferInsertModel<typeof regionsTable>[] = regions.map(
    (region) => ({
      id: Number(region.IDCCAA),
      name: region.CCAA,
    })
  );

  await db.insert(regionsTable).values(regionsInsert).onConflictDoNothing();

  const provincesRes = await fetch(
    "https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes/Listados/Provincias/",
    {
      headers: {
        Accept: "application/json",
      },
    }
  );
  if (!provincesRes.ok) {
    throw new Error("Failed to fetch provinces");
  }
  const provinces = (await provincesRes.json()) as ProvinceRes[];

  const provincesInsert: InferInsertModel<typeof provincesTable>[] =
    provinces.map((province) => ({
      id: Number(province.IDPovincia),
      name: titleCase(province.Provincia),
      regionId: Number(province.IDCCAA),
    }));

  await db.insert(provincesTable).values(provincesInsert).onConflictDoNothing();

  const citiesRes = await fetch(
    "https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes/Listados/Municipios/",
    {
      headers: {
        Accept: "application/json",
      },
    }
  );
  if (!citiesRes.ok) {
    throw new Error("Failed to fetch cities");
  }
  const cities = (await citiesRes.json()) as CityRes[];

  const citiesInsert: InferInsertModel<typeof citiesTable>[] = cities.map<
    InferInsertModel<typeof citiesTable>
  >((city) => ({
    id: Number(city.IDMunicipio),
    name: titleCase(city.Municipio),
    provinceId: Number(city.IDProvincia),
  }));

  await db.insert(citiesTable).values(citiesInsert).onConflictDoNothing();
};

interface GobResponse {
  Fecha: string;
  ListaEESSPrecio: Station[];
  ResultadoConsulta: string;
  Nota: string;
}

interface Station {
  "C.P.": string;
  Dirección: string;
  Horario: string;
  Latitud: string;
  Localidad: string;
  "Longitud (WGS84)": string;
  Margen: string;
  Municipio: string;
  "Precio Biodiesel": string;
  "Precio Bioetanol": string;
  "Precio Gas Natural Comprimido": string;
  "Precio Gas Natural Licuado": string;
  "Precio Gases licuados del petróleo": string;
  "Precio Gasoleo A": string;
  "Precio Gasoleo B": string;
  "Precio Gasoleo Premium": string;
  "Precio Gasolina 95 E10": string;
  "Precio Gasolina 95 E5": string;
  "Precio Gasolina 95 E5 Premium": string;
  "Precio Gasolina 98 E10": string;
  "Precio Gasolina 98 E5": string;
  "Precio Hidrogeno": string;
  Provincia: string;
  Remisión: string;
  Rótulo: string;
  "Tipo Venta": string;
  "% BioEtanol": string;
  "% Éster metílico": string;
  IDEESS: string;
  IDMunicipio: string;
  IDProvincia: string;
  IDCCAA: string;
}

interface RegionRes {
  IDCCAA: string;
  CCAA: string;
}

interface ProvinceRes {
  IDPovincia: string;
  IDCCAA: string;
  Provincia: string;
  CCAA: string;
}

interface CityRes {
  IDMunicipio: string;
  IDProvincia: string;
  IDCCAA: string;
  Municipio: string;
  Provincia: string;
  CCAA: string;
}
