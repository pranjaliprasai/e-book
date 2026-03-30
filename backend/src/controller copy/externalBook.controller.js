import { fetchGutenbergBooksService, fetchOpenLibraryBooksService } from "../service/externalBook.service.js";
import successResponse from "../utils/success.response.js";

export const getGutenbergBooksController = async (req, res, next) => {
    try {
        const { query } = req.query;
        const books = await fetchGutenbergBooksService(query);
        successResponse({
            success: true,
            message: "Gutenberg books fetched successfully",
            data: books
        }, res);
    } catch (error) {
        next(error);
    }
};

export const getOpenLibraryBooksController = async (req, res, next) => {
    try {
        const { query } = req.query;
        const books = await fetchOpenLibraryBooksService(query);
        successResponse({
            success: true,
            message: "Open Library books fetched successfully",
            data: books
        }, res);
    } catch (error) {
        next(error);
    }
};
