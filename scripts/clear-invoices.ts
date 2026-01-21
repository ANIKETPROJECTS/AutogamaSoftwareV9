import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Setup __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config();

const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/autogarage";

async function clearInvoices() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected successfully.');

    // Define the Invoice schema to access the collection
    const InvoiceSchema = new mongoose.Schema({
      invoiceNumber: String
    }, { strict: false });

    const Invoice = mongoose.model('Invoice', InvoiceSchema);

    console.log('Clearing all invoices...');
    const result = await Invoice.deleteMany({});
    console.log(`Successfully deleted ${result.deletedCount} invoices.`);

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
    process.exit(0);
  } catch (error) {
    console.error('An error occurred:', error);
    process.exit(1);
  }
}

clearInvoices();
