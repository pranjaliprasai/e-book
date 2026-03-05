import mongoose from 'mongoose';
import dotenv from 'dotenv';
import axios from 'axios';
import path from 'path';
import { fileURLToPath } from 'url';

// Setup __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const MONGO_URL = process.env.MONGO_URL;

const bookSchema = new mongoose.Schema({
    title: { type: String, required: true },
    author: { type: String, required: true },
    genre: { type: String },
    description: { type: String },
    isbn: { type: String, unique: true },
    pdfUrl: { type: String },
    coverImageUrl: { type: String },
    externalId: { type: String, unique: true },
}, { timestamps: true });

const Book = mongoose.model('Book', bookSchema);

const GENRES = [
    'Fiction', 'Mystery', 'Thriller', 'Romance', 'Science Fiction',
    'Fantasy', 'Horror', 'History', 'Biography', 'Science', 'Art', 'Religion'
];

const fetchGutenbergBatch = async (topic, limit = 50) => {
    try {
        const url = `https://gutendex.com/books?topic=${encodeURIComponent(topic)}`;
        const response = await axios.get(url);
        return response.data.results.slice(0, limit).map(book => ({
            title: book.title,
            author: book.authors[0]?.name || 'Unknown Author',
            isbn: `GUT-${book.id}`,
            genre: topic,
            isDiscovery: true,
            description: `A classic work of ${topic} available from Project Gutenberg.`,
            coverImageUrl: book.formats['image/jpeg'] || 'https://via.placeholder.com/300x450?text=No+Cover',
            pdfUrl: book.formats['application/pdf'] || book.formats['text/plain; charset=utf-8'] || '',
            externalId: String(book.id)
        }));
    } catch (error) {
        console.error(`Error Gutenberg [${topic}]:`, error.message);
        return [];
    }
};

const fetchOpenLibraryBatch = async (subject, limit = 50) => {
    try {
        const url = `https://openlibrary.org/subjects/${encodeURIComponent(subject.toLowerCase().replace(' ', '_'))}.json?limit=${limit}`;
        const response = await axios.get(url);
        return response.data.works.map(book => ({
            title: book.title,
            author: book.authors?.[0]?.name || 'Unknown Author',
            isbn: `OL-${book.key.split('/').pop()}`,
            genre: subject,
            isDiscovery: true,
            description: `A discovered work of ${subject} from Open Library.`,
            coverImageUrl: book.cover_id
                ? `https://covers.openlibrary.org/b/id/${book.cover_id}-L.jpg`
                : 'https://via.placeholder.com/300x450?text=No+Cover',
            pdfUrl: '',
            externalId: book.key
        }));
    } catch (error) {
        console.error(`Error OpenLibrary [${subject}]:`, error.message);
        return [];
    }
};

const seed = async () => {
    try {
        await mongoose.connect(MONGO_URL);
        console.log('Connected to MongoDB Atlas...');

        let totalAdded = 0;

        for (const genre of GENRES) {
            console.log(`Processing genre: ${genre}...`);
            const [gBatch, olBatch] = await Promise.all([
                fetchGutenbergBatch(genre, 50),
                fetchOpenLibraryBatch(genre, 50)
            ]);

            const combined = [...gBatch, ...olBatch];

            for (const bookData of combined) {
                try {
                    const existing = await Book.findOne({
                        $or: [{ externalId: bookData.externalId }, { isbn: bookData.isbn }]
                    });

                    if (!existing) {
                        await Book.create(bookData);
                        totalAdded++;
                    }
                } catch (err) {
                    // Skip duplicates or errors
                }
            }

            console.log(`Added ${totalAdded} books so far...`);
            if (totalAdded >= 1000) break;
            await new Promise(r => setTimeout(r, 1000));
        }

        console.log(`Finished! Total books in DB: ${totalAdded}`);
        process.exit(0);
    } catch (err) {
        console.error('Fatal Error:', err);
        process.exit(1);
    }
};

seed();
