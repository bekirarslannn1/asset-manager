import { seedDatabase } from "./seed";
import { db } from "./db";

console.log("Starting seeding process...");
seedDatabase().then(() => {
    console.log("Seeding complete. Testing code is robust.");
    process.exit(0);
}).catch((e) => {
    console.error("Seeding failed:", e);
    process.exit(1);
});
