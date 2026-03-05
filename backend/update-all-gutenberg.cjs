const mongoose = require('mongoose');
require('dotenv').config();

async function updateAllGutenberg() {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log('Connected to MongoDB');

        const result = await mongoose.connection.collection('books').updateMany(
            { isbn: /^GUT-/ },
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

        console.log(`Successfully updated ${result.modifiedCount} Gutenberg books with direct HTML links.`);
        process.exit(0);
    } catch (err) {
        console.error('Update failed:', err);
        process.exit(1);
    }
}

updateAllGutenberg();
