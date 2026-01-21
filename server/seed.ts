import { connectDB } from "./db";
import { Inventory } from "./models/index";
import dotenv from "dotenv";

dotenv.config();

// Fallback for VPS environments where env might not be loaded in shell
if (!process.env.MONGODB_URI) {
  process.env.MONGODB_URI = "mongodb://localhost:27017/autogarage";
}

const PPF_CATEGORIES = {
  "Elite": { "car": { "5yr": 55000, "7yr": 65000 }, "bike": { "5yr": 12000, "7yr": 15000 } },
  "Garware Matt": { "car": { "3yr": 75000, "5yr": 85000 }, "bike": { "3yr": 18000, "5yr": 22000 } },
  "Garware Plus": { "car": { "3yr": 60000, "5yr": 70000 }, "bike": { "3yr": 15000, "5yr": 18000 } },
  "Garware Premium": { "car": { "3yr": 90000, "5yr": 105000 }, "bike": { "3yr": 25000, "5yr": 30000 } }
};

async function seed() {
  try {
    await connectDB();
    console.log("Connected to MongoDB for seeding...");

    for (const name of Object.keys(PPF_CATEGORIES)) {
      const exists = await Inventory.findOne({ name, category: { $ne: 'Accessories' } });
      if (!exists) {
        await Inventory.create({
          name,
          category: 'PPF',
          quantity: 1, // Initial roll count
          unit: 'rolls',
          price: 0,
          minStock: 1,
          rolls: [{
            name: `${name} Roll 1`,
            meters: 15,
            squareFeet: 150,
            remaining_meters: 15,
            remaining_sqft: 150,
            status: 'Available',
            unit: 'Meters'
          }],
          history: [{
            date: new Date(),
            type: 'Stock In',
            description: 'Initial stock seeding',
            amount: 1,
            remainingStock: 1
          }]
        });
        console.log(`Created PPF Category with roll: ${name}`);
      } else {
        // If it exists but has no rolls, add one
        if (exists.rolls.length === 0) {
          exists.rolls.push({
            name: `${name} Roll 1`,
            meters: 15,
            squareFeet: 150,
            remaining_meters: 15,
            remaining_sqft: 150,
            status: 'Available',
            unit: 'Meters'
          });
          exists.quantity = 1;
          exists.history.push({
            date: new Date(),
            type: 'Stock In',
            description: 'Seeded initial roll',
            amount: 1,
            remainingStock: 1
          });
          await exists.save();
          console.log(`Added initial roll to existing category: ${name}`);
        } else {
          console.log(`PPF Category already has rolls: ${name}`);
        }
      }
    }

    console.log("Seeding completed successfully.");
    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
}

seed();
