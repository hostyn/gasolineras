import { CronJob } from "cron";
import { scrapeGob } from "./scrapers/gob";
import moment from "moment";
import { scrapePetroprix } from "./scrapers/petroprix";
import { scrapePlenoil } from "./scrapers/plenoil";
import { migrateDatabase } from "@repo/database";

const main = async () => {
  if (process.env.NODE_ENV === "production") {
    console.time("✅ Database migrated");
    await migrateDatabase();
    console.timeEnd("✅ Database migrated");
  }

  await new Promise((resolve) => setTimeout(resolve, 1000));

  console.time("✅ Gob scraped");
  await scrapeGob();
  console.timeEnd("✅ Gob scraped");

  await Promise.all([scrapePetroprix(), scrapePlenoil()]);
};

CronJob.from({
  cronTime: "*/10 * * * *",
  onTick: async () => {
    console.log(moment().format("DD/MM/YYYY HH:mm:ss"), "Running scraper...");
    console.time("✅ Scraper executed successfully");
    await main();
    console.timeEnd("✅ Scraper executed successfully");
  },
  runOnInit: true,
  timeZone: "Europe/Madrid",
  waitForCompletion: true,
}).start();
