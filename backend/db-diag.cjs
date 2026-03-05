const mongoose = require('mongoose');
const MONGO_URL = 'mongodb+srv://pranjaliprasai:pranjaliprasai@cluster0.ohjju7o.mongodb.net/?appName=Cluster0';

const bookSchema = new mongoose.Schema({
    title: String,
    isDiscovery: { type: Boolean, default: false },
    isbn: String,
    genre: String,
    externalId: String
}, { timestamps: true });

const bookModel = mongoose.model('Book', bookSchema);

async function run() {
    try {
        await mongoose.connect(MONGO_URL);
        console.log('Connected to MongoDB');

        const total = await bookModel.countDocuments();
        console.log('Total books in DB:', total);

        const counts = await bookModel.aggregate([
            { $group: { _id: '$isDiscovery', count: { $sum: 1 } } }
        ]);
        console.log('Counts by isDiscovery:', JSON.stringify(counts));

        const genreCounts = await bookModel.aggregate([
            { $group: { _id: '$genre', count: { $sum: 1 } } }
        ]);
        console.log('Counts by Genre:', JSON.stringify(genreCounts));

        const samples = await bookModel.find().limit(5);
        console.log('Samples:', JSON.stringify(samples, null, 2));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

run();
