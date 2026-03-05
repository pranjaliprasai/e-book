import axios from 'axios';

async function testApi() {
    try {
        console.log("Testing API with search query...");

        // Let's assume there is a seed token or we can just mock a token, wait, the API requires verifyToken.
        // Instead of hitting the authenticated API, I'll test sending a raw Axios request for query string construction.

        const config = {
            params: { genre: undefined, isDiscovery: undefined, search: 'science fiction' }
        };

        const urlBuilder = axios.getUri({ url: 'http://localhost:5000/api/book', ...config });
        console.log("Axios builds URL as:", urlBuilder);

        // Let's also test what happens inside the controller manually by creating a mock req object.
        const req = {
            query: {
                search: 'science fiction'
            }
        };

        const { search, genre, isDiscovery, limit } = req.query;
        const query = {};
        if (genre) query.genre = genre;
        if (isDiscovery !== undefined) {
            const isDiscVal = isDiscovery === 'true' || isDiscovery === true;
            if (isDiscVal) query.isDiscovery = true;
            else query.isDiscovery = { $ne: true };
        }

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { author: { $regex: search, $options: 'i' } },
                { genre: { $regex: search, $options: 'i' } }
            ];
        }

        console.log("Query object generated:", JSON.stringify(query, null, 2));
    } catch (e) {
        console.error(e);
    }
}

testApi();
