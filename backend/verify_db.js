import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Adjust path to .env file in the backend directory
dotenv.config({ path: 'c:/Final_Year_Project/e-book/backend/.env' });

const MONGO_URL = process.env.MONGO_URL;

async function verify() {
    try {
        await mongoose.connect(MONGO_URL);
        console.log('Connected to MongoDB...');

        const bookSchema = new mongoose.Schema({}, { strict: false });
        const Book = mongoose.model('Book', bookSchema, 'books');

        // Test Gutenberg filter
        const gutenbergQuery = { isbn: { $regex: /^GUT-/ } };
        const gutenbergBooks = await Book.find(gutenbergQuery).limit(5);
        console.log(`\n--- Gutenberg Books (regex search) ---`);
        console.log(`Found ${gutenbergBooks.length} sample Gutenberg books.`);
        gutenbergBooks.forEach(b => console.log(`- ${b.title} (${b.isbn})`));

        // Test OpenLibrary filter
        const olQuery = { isbn: { $regex: /^OL-/ } };
        const olBooks = await Book.find(olQuery).limit(5);
        console.log(`\n--- OpenLibrary Books (regex search) ---`);
        console.log(`Found ${olBooks.length} sample OpenLibrary books.`);
        olBooks.forEach(b => console.log(`- ${b.title} (${b.isbn})`));

        // Verify total distribution
        const gutenbergCount = await Book.countDocuments(gutenbergQuery);
        const olCount = await Book.countDocuments(olQuery);
        const totalCount = await Book.countDocuments();

        console.log(`\n--- Summary ---`);
        console.log(`Total books in DB: ${totalCount}`);
        console.log(`Gutenberg books: ${gutenbergCount}`);
        console.log(`OpenLibrary books: ${olCount}`);

        process.exit(0);
    } catch (error) {
        console.error('Verification failed:', error);
        process.exit(1);
    }
}

verify();
