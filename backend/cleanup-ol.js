import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bookModel from './src/model/book.model.js';

dotenv.config();

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log('Connected to MongoDB');

        const result = await bookModel.deleteMany({ isbn: { $regex: /^OL-/ } });
        console.log(`🗑️ Removed ${result.deletedCount} Open Library books from the database.`);

        process.exit(0);
    } catch (err) {
        console.error('Cleanup failed:', err);
        process.exit(1);
    }
}

run();
