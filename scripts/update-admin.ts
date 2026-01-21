import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/autogarage";

async function updateAdmin() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected successfully.');

    const Admin = mongoose.model('Admin', new mongoose.Schema({}, { strict: false }));

    console.log('Clearing all old admin credentials and setting new ones...');
    // Delete all existing admins first to avoid duplicate key errors
    await Admin.deleteMany({});
    
    console.log('Creating new admin credentials...');
    const result = await Admin.create({ 
      email: 'abhishek@autogamma.in',
      password: 'Abhishek@132231',
      name: 'Abhishek',
      createdAt: new Date()
    });
    
    console.log(`Successfully created admin account: ${result.email}`);

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
    process.exit(0);
  } catch (error) {
    console.error('An error occurred:', error);
    process.exit(1);
  }
}

updateAdmin();
