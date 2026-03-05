const mongoose = require('mongoose');
require('dotenv').config();

async function updateLinks() {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log('Connected to MongoDB');

        // We want to update Gutenberg books that either have no pdfUrl 
        // or have a pdfUrl that points to the landing page (e.g. https://www.gutenberg.org/ebooks/123)
        const result = await mongoose.connection.collection('books').updateMany(
            {
                isbn: /^GUT-/,
                $or: [
                    { pdfUrl: '' },
                    { pdfUrl: null },
                    { pdfUrl: { $regex: /ebooks\/\d+$/ } }
                ]
            },
            [
                {
                    $set: {
                        pdfUrl: {
                            $concat: [
                                'https://www.gutenberg.org/ebooks/',
                                '$externalId',
                                '.html.images'
                            ]
                        }
                    }
                }
            ]
        );

        console.log(`Updated ${result.modifiedCount} Gutenberg books with direct links.`);
        process.exit(0);
    } catch (err) {
        console.error('Update failed:', err);
        process.exit(1);
    }
}

updateLinks();
