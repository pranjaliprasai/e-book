import Book from '../model/book.model.js';

/**
 * Get smart recommendations based on a book's content (Author, Genre, Title)
 */
export const getRecommendationsService = async (bookId, limit = 5) => {
    try {
        const sourceBook = await Book.findById(bookId);
        if (!sourceBook) {
            throw new Error('Source book not found');
        }

        // We use an aggregation pipeline to score books based on similarity
        // 1. Author match (highest weight)
        // 2. Genre match (medium weight)
        // 3. Title word overlap (lower weight)
        
        // Extract title words for comparison, removing common short words
        const titleWords = sourceBook.title
            .toLowerCase()
            .replace(/[^\w\s]/g, '')
            .split(/\s+/)
            .filter(word => word.length > 3);

        const recommendations = await Book.aggregate([
            {
                $match: {
                    _id: { $ne: sourceBook._id } // Don't recommend the same book
                }
            },
            {
                $addFields: {
                    score: {
                        $add: [
                            // Score for matching author
                            { $cond: [{ $eq: ["$author", sourceBook.author] }, 10, 0] },
                            // Score for matching genre
                            { $cond: [{ $eq: ["$genre", sourceBook.genre] }, 5, 0] },
                            // Score for rating (as a slight boost)
                            { $multiply: ["$rating", 0.5] }
                        ]
                    }
                }
            },
            // Add score for title word overlap
            {
                $set: {
                    score: {
                        $add: [
                            "$score",
                            {
                                $size: {
                                    $setIntersection: [
                                        { 
                                            $split: [
                                                { $toLower: { $replaceAll: { input: "$title", find: "[^\\w\\s]", replacement: "" } } }, 
                                                " " 
                                            ] 
                                        },
                                        titleWords
                                    ]
                                }
                            }
                        ]
                    }
                }
            },
            { $sort: { score: -1, rating: -1 } },
            { $limit: limit },
            {
                $project: {
                    title: 1,
                    author: 1,
                    genre: 1,
                    coverImageUrl: 1,
                    rating: 1,
                    score: 1,
                    isLocked: 1,
                    isbn: 1
                }
            }
        ]);

        return recommendations;
    } catch (error) {
        console.error('Recommendation Error:', error);
        throw error;
    }
};

/**
 * Get general trending/popular recommendations (fallback)
 */
export const getTrendingRecommendationsService = async (limit = 10) => {
    return await Book.find()
        .sort({ rating: -1, createdAt: -1 })
        .limit(limit);
};
