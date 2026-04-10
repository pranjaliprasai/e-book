import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Book from './src/model/book.model.js';

dotenv.config();

async function checkBooks() {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        const allBooks = await Book.countDocuments();
        const discoveryBooks = await Book.countDocuments({ isDiscovery: true });
        const nonDiscoveryBooks = await Book.countDocuments({ isDiscovery: { $ne: true } });
        
        console.log(`Total Books in DB: ${allBooks}`);
        console.log(`Discovery Books: ${discoveryBooks}`);
        console.log(`Non-Discovery Books: ${nonDiscoveryBooks}`);
        
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkBooks();
