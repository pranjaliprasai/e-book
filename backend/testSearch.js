import mongoose from 'mongoose';

async function test() {
    const MONGO_URL = "mongodb+srv://pranjaliprasai:pranjaliprasai@cluster0.ohjju7o.mongodb.net/?appName=Cluster0";
    await mongoose.connect(MONGO_URL);
    const bookSchema = new mongoose.Schema({ title: String, author: String, genre: String }, { strict: false });
    const bookModel = mongoose.model('Book', bookSchema, 'books');

    // Simulate query parameters
    const search = 'fiction';
    const query = {
        $or: [
            { title: { $regex: search, $options: 'i' } },
            { author: { $regex: search, $options: 'i' } },
            { genre: { $regex: search, $options: 'i' } }
        ]
    };

    console.log("Constructed MongoDB Query:", JSON.stringify(query, null, 2));
    const results = await bookModel.find(query);
    console.log('Results found matching "fiction":', results.length);
    if (results.length > 0) {
        console.log('Sample result:', results[0].title, results[0].author, results[0].genre);
    }

    const allBooks = await bookModel.find().limit(5);
    console.log('Total books sample count:', allBooks.length);

    process.exit(0);
}

test().catch(console.error);
