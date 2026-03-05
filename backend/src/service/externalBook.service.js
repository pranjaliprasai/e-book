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

        const response = await axios.get(url);

        return response.data.results.map((book) => ({
            id: book.id,
            title: book.title,
            authors: book.authors.map((a) => a.name),
            cover: book.formats['image/jpeg'] || 'https://via.placeholder.com/150',
            source: 'Gutenberg',
            downloadUrl: book.formats['application/pdf'] || book.formats['text/plain; charset=utf-8']
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

        return response.data.docs.map((book) => ({
            id: book.key,
            title: book.title,
            authors: book.author_name || ['Unknown Author'],
            cover: book.cover_i
                ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`
                : 'https://via.placeholder.com/150',
            source: 'OpenLibrary'
        }));
    } catch (error) {
        console.error('Error in fetchOpenLibraryBooksService:', error.message);
        throw error;
    }
};
