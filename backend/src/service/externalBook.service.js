import axios from 'axios';

const EXTERNAL_APIS = {
    GUTENBERG: "https://gutendex.com/books",
    OPEN_LIBRARY: "https://openlibrary.org/search.json",
};

export const fetchGutenbergBooksService = async (query = '') => {
    try {
        const url = query
            ? `${EXTERNAL_APIS.GUTENBERG}?search=${encodeURIComponent(query)}`
            : EXTERNAL_APIS.GUTENBERG;

        const formatDescription = (desc) => {
            if (!desc) return '';
            let cleaned = desc.replace(/\(This is an automatically generated summary\.\)/ig, '').trim();
            const words = cleaned.split(/\s+/);
            if (words.length > 100) {
                return words.slice(0, 100).join(' ') + '...';
            }
            return cleaned;
        };

        const response = await axios.get(url);

        return response.data.results.map((book) => ({
            id: book.id,
            title: book.title,
            authors: book.authors.map((a) => a.name),
            cover: book.formats['image/jpeg'] || 'https://via.placeholder.com/150',
            source: 'Gutenberg',
            downloadUrl: book.formats['application/pdf'] || book.formats['text/plain; charset=utf-8'],
            description: book.summaries && book.summaries.length > 0
                ? formatDescription(book.summaries[0])
                : '',
            rating: parseFloat((Math.random() * (5.0 - 3.5) + 3.5).toFixed(1))
        }));
    } catch (error) {
        console.error('Error in fetchGutenbergBooksService:', error.message);
        throw error;
    }
};

export const fetchOpenLibraryBooksService = async (query) => {
    try {
        if (!query) return [];

        const url = `${EXTERNAL_APIS.OPEN_LIBRARY}?q=${encodeURIComponent(query)}&limit=10`;
        const response = await axios.get(url);

        const books = response.data.docs.slice(0, 10);

        // Fetch detailed info for each book to get the description
        const detailedBooks = await Promise.all(books.map(async (book) => {
            let description = '';
            try {
                const workUrl = `https://openlibrary.org${book.key}.json`;
                const workRes = await axios.get(workUrl);
                if (workRes.data && workRes.data.description) {
                    let descText = typeof workRes.data.description === 'object'
                        ? workRes.data.description.value
                        : workRes.data.description;

                    const words = descText.trim().split(/\s+/);
                    description = words.length > 100 ? words.slice(0, 100).join(' ') + '...' : descText.trim();
                }
            } catch (err) {
                console.error(`Error fetching description for ${book.key}:`, err.message);
            }

            return {
                id: book.key,
                title: book.title,
                authors: book.author_name || ['Unknown Author'],
                cover: book.cover_i
                    ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`
                    : 'https://via.placeholder.com/150',
                source: 'OpenLibrary',
                description: description,
                rating: parseFloat((Math.random() * (5.0 - 3.5) + 3.5).toFixed(1))
            };
        }));

        return detailedBooks;
    } catch (error) {
        console.error('Error in fetchOpenLibraryBooksService:', error.message);
        throw error;
    }
};
