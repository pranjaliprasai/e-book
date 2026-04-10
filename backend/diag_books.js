import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const bookSchema = new mongoose.Schema({
    title: String,
    author: String,
    isbn: String,
    isDiscovery: Boolean,
});

const Book = mongoose.models.Book || mongoose.model('Book', bookSchema);

async function check() {
    const url = process.env.MONGO_URL || process.env.MONGODB_URI;
    if (!url) {
        console.error('MONGO_URL not found in environment');
        return;
    }
    await mongoose.connect(url);
    console.log('Connected to MongoDB');

    const sample = await Book.findOne({ isDiscovery: true });
    console.log('Sample Discovery Book:', sample);

    const countGUT = await Book.countDocuments({ isDiscovery: true, isbn: { $regex: /^GUT-/ } });
    console.log('Discovery Books with GUT- ISBN:', countGUT);

    const countAllGUT = await Book.countDocuments({ isbn: { $regex: /^GUT-/ } });
    console.log('Total Books with GUT- ISBN:', countAllGUT);

    const countDiscNoGUT = await Book.countDocuments({ isDiscovery: true, isbn: { $not: { $regex: /^GUT-/ } } });
    console.log('Discovery Books WITHOUT GUT- ISBN:', countDiscNoGUT);

    await mongoose.connection.close();
}

check().catch(console.error);
