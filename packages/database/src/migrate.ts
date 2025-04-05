import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db } from ".";
import path from "path";

export const migrateDatabase = async () => {
  migrate(db, {
    migrationsFolder: path.resolve(
      require.resolve("@repo/database"),
      "../../../drizzle"
    ),
  });
};
