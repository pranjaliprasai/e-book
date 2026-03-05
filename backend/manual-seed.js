import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { seedDiscoveryBooksService } from './src/service/bookSeed.service.js';

dotenv.config();

async function run() {
    try {
        console.log('Connecting to:', process.env.MONGO_URL);
        await mongoose.connect(process.env.MONGO_URL);
        console.log('Connected to MongoDB');

        const result = await seedDiscoveryBooksService();
        console.log('Seed result:', JSON.stringify(result, null, 2));

        process.exit(0);
    } catch (err) {
        console.error('Seed failed:', err);
        process.exit(1);
    }
}

run();
