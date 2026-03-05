import mongoose from 'mongoose';

async function test() {
    const MONGO_URL = "mongodb+srv://pranjaliprasai:pranjaliprasai@cluster0.ohjju7o.mongodb.net/?appName=Cluster0";
    await mongoose.connect(MONGO_URL);
    const bookSchema = new mongoose.Schema({ title: String, author: String, genre: String, isDiscovery: Boolean }, { strict: false });
    const bookModel = mongoose.model('Book', bookSchema, 'books');

    // Fixed: search does NOT apply isDiscovery filter
    const search = 'Fiction ';
    const trimmedSearch = search.trim();
    const query = {
        $or: [
            { title: { $regex: trimmedSearch, $options: 'i' } },
            { author: { $regex: trimmedSearch, $options: 'i' } },
            { genre: { $regex: trimmedSearch, $options: 'i' } }
        ]
        // NO isDiscovery filter here!
    };

    const results = await bookModel.find(query);
    console.log(`✅ Results found matching "${search.trim()}":`, results.length);
    if (results.length > 0) {
        console.log('Sample result:', results[0].title, '|', results[0].genre);
    }
    process.exit(0);
}

test().catch(console.error);
