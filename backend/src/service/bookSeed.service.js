import axios from 'axios';
import bookModel from '../model/book.model.js';

const GENRES = [
    'Fiction', 'Mystery', 'Thriller', 'Romance', 'Science Fiction',
    'Fantasy', 'Horror', 'History', 'Biography', 'Science', 'Art', 'Religion',
    'Adventure', 'Children', 'Comedy', 'Drama', 'Poetry', 'Philosophy', 'Politics',
    'Travel', 'Cooking', 'Medical', 'Psychology', 'Sociology', 'Law', 'Music',
    'Natural History', 'Animals', 'Gardening', 'Reference', 'Education', 'Fairy Tales',
    'Mythology', 'Westerns', 'Short Stories', 'Essays', 'Letters', 'Diaries',
    'War', 'Crime', 'Gothic', 'Satire', 'Humor', 'Ancient History', 'Medieval History',
    'Renaissance', 'Industrial Revolution', 'Modern History', 'Classic Literature'
];

/**
 * Bulk fetch books from Project Gutenberg (Gutendex)
 */
const fetchGutenbergBatch = async (topic, limit = 50) => {
    let results = [];
    let page = 1;
    try {
        while (results.length < limit) {
            const url = `https://gutendex.com/books?topic=${encodeURIComponent(topic)}&page=${page}`;
            const response = await axios.get(url);

            if (!response.data.results || response.data.results.length === 0) break;

            const mapped = response.data.results.map(book => {
                // Prioritize HTML for direct reading, then PDF, then plain text
                const directUrl = book.formats['text/html'] ||
                    book.formats['text/html; charset=utf-8'] ||
                    book.formats['application/pdf'] ||
                    book.formats['text/plain; charset=utf-8'] ||
                    '';

                return {
                    title: book.title,
                    author: book.authors[0]?.name || 'Unknown Author',
                    isbn: `GUT-${book.id}`,
                    genre: topic,
                    description: book.summaries && book.summaries.length > 0
                        ? book.summaries[0].replace(/\(This is an automatically generated summary\.\)/ig, '').trim()
                        : `A classic work of ${topic} available from Project Gutenberg.`,
                    coverImageUrl: book.formats['image/jpeg'] || 'https://via.placeholder.com/300x450?text=No+Cover',
                    pdfUrl: directUrl,
                    externalId: String(book.id),
                    isDiscovery: true,
                    rating: parseFloat((Math.random() * (5.0 - 3.5) + 3.5).toFixed(1))
                };
            });

            results = [...results, ...mapped];
            if (!response.data.next) break;
            page++;
        }
        return results.slice(0, limit);
    } catch (error) {
        console.error(`Error fetching Gutenberg batch for ${topic}:`, error.message);
        return results;
    }
};

/**
 * Bulk fetch books from Open Library
 */
const fetchOpenLibraryBatch = async (subject, limit = 50) => {
    try {
        const url = `https://openlibrary.org/subjects/${encodeURIComponent(subject.toLowerCase().replace(' ', '_'))}.json?limit=${limit}`;
        const response = await axios.get(url);
        const detailedWorks = await Promise.all(response.data.works.map(async (book) => {
            let description = '';
            try {
                // book.key comes as e.g. "/works/OL12345W"
                const workUrl = `https://openlibrary.org${book.key}.json`;
                const workRes = await axios.get(workUrl);
                if (workRes.data && workRes.data.description) {
                    description = typeof workRes.data.description === 'object'
                        ? workRes.data.description.value
                        : workRes.data.description;
                }
            } catch (err) {
                console.error(`Error fetching description for ${book.key}:`, err.message);
            }

            return {
                title: book.title,
                author: book.authors?.[0]?.name || 'Unknown Author',
                isbn: `OL-${book.key.split('/').pop()}`,
                genre: subject,
                description: description || '',
                coverImageUrl: book.cover_id
                    ? `https://covers.openlibrary.org/b/id/${book.cover_id}-L.jpg`
                    : 'https://via.placeholder.com/300x450?text=No+Cover',
                pdfUrl: '', // Open Library often requires separate fetching for PDF links
                externalId: book.key,
                isDiscovery: true,
                rating: parseFloat((Math.random() * (5.0 - 3.5) + 3.5).toFixed(1))
            };
        }));

        return detailedWorks;
    } catch (error) {
        console.error(`Error fetching Open Library batch for ${subject}:`, error.message);
        return [];
    }
};

export const seedDiscoveryBooksService = async () => {
    let totalAdded = 0;
    const errors = [];

    console.log('🚀 Starting bulk Project Gutenberg discovery seeding...');

    // Migration: Update any existing books that look like discovery books (GUT- or OL- ISBNs)
    // but might be missing the isDiscovery: true flag from previous runs.
    const migrationResult = await bookModel.updateMany(
        {
            isDiscovery: { $ne: true },
            $or: [
                { isbn: { $regex: /^GUT-/ } },
                { isbn: { $regex: /^OL-/ } },
                { externalId: { $exists: true } }
            ]
        },
        { $set: { isDiscovery: true } }
    );
    console.log(`🧹 Migrated ${migrationResult.modifiedCount} existing books to discovery mode.`);

    for (const genre of GENRES) {
        try {
            console.log(`fetching books for genre: ${genre}...`);

            // Fetch only from Project Gutenberg
            const combined = await fetchGutenbergBatch(genre, 100);

            for (const bookData of combined) {
                // Check if already exists to avoid duplicates
                const existing = await bookModel.findOne({
                    $or: [{ externalId: bookData.externalId }, { isbn: bookData.isbn }]
                });

                if (!existing) {
                    await bookModel.create(bookData);
                    totalAdded++;
                }

                if (totalAdded >= 1000) break;
            }

            console.log(`✅ Progress: Added ${totalAdded} books so far...`);

            if (totalAdded >= 1000) break;

            // Small delay to avoid hammering APIs
            await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (err) {
            errors.push({ genre, error: err.message });
        }
    }

    console.log(`✨ Seeding complete. Total books added: ${totalAdded}`);
    return { success: true, totalAdded, errors };
};
