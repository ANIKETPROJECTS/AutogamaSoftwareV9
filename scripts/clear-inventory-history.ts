import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/autogarage";

async function clearInventoryHistory() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected successfully.');

    // Access the Inventory collection
    // Based on server/models/index.ts, history is an array field inside IInventoryItem
    const Inventory = mongoose.model('Inventory', new mongoose.Schema({}, { strict: false }));

    console.log('Clearing history from all inventory items...');
    const result = await Inventory.updateMany(
      {}, 
      { $set: { history: [] } }
    );
    
    console.log(`Successfully cleared history for ${result.modifiedCount} inventory items.`);

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
    process.exit(0);
  } catch (error) {
    console.error('An error occurred:', error);
    process.exit(1);
  }
}

clearInventoryHistory();
