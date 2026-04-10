import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const Book = mongoose.models.Book || mongoose.model('Book', new mongoose.Schema({
    coverImageUrl: String,
    title: String
}));

async function check() {
    await mongoose.connect(process.env.MONGO_URL);
    const countNoCover = await Book.countDocuments({ 
        $or: [
            { coverImageUrl: { $exists: false } },
            { coverImageUrl: null },
            { coverImageUrl: "" }
        ]
    });
    console.log('Books without coverImageUrl:', countNoCover);
    await mongoose.connection.close();
}
check().catch(console.error);
