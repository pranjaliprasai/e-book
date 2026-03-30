import {
    addBookService,
    getAllBooksService,
    updateBookService,
    deleteBookService,
    importBookService,
    getBookByIdService,
} from "../service/book.service.js";
import { seedDiscoveryBooksService as bulkSeedService } from "../service/bookSeed.service.js";
import successResponse from "../utils/success.response.js";
import { AppError } from "../utils/error.js";

export const importExternalBookController = async (req, res, next) => {
    try {
        const bookData = req.body;
        const book = await importBookService(bookData);

        successResponse(
            {
                success: true,
                message: "Book imported successfully!",
                data: book,
            },
            res
        );
    } catch (error) {
        console.error("Error in importExternalBookController:", error);
        next(error);
    }
};

export const addBookController = async (req, res, next) => {
    try {
        const { title, author, genre, description, isbn } = req.body;

        if (!req.files || !req.files.pdf || !req.files.coverImage) {
            throw new AppError("Both PDF and Cover Image are required", 400);
        }

        const pdfUrl = req.files.pdf[0].path;
        const coverImageUrl = req.files.coverImage[0].path;

        const book = await addBookService({
            title,
            author,
            genre,
            description,
            isbn,
            pdfUrl,
            coverImageUrl,
        });

        successResponse(
            {
                success: true,
                message: "Book added successfully",
                data: book,
            },
            res
        );
    } catch (error) {
        console.error("Error in addBookController:", error);
        next(error);
    }
};

export const getBookByIdController = async (req, res, next) => {
    try {
        const { id } = req.params;
        const book = await getBookByIdService(id);
        successResponse(
            {
                success: true,
                message: "Book fetched successfully",
                data: book,
            },
            res
        );
    } catch (error) {
        console.error("Error in getBookByIdController:", error);
        next(error);
    }
};

export const getAllBooksController = async (req, res, next) => {
    try {
        console.log(`[API] => GET /books query:`, req.query);
        const { genre, isDiscovery, limit, search, source } = req.query;
        const books = await getAllBooksService(genre, isDiscovery, limit, search, source);
        console.log(`[API] <= /books returns ${books?.length} books`);
        successResponse(
            {
                success: true,
                message: genre ? `Books for genre ${genre} fetched successfully` : "Books fetched successfully",
                data: books,
            },
            res
        );
    } catch (error) {
        console.error("Error in getAllBooksController:", error);
        next(error);
    }
};

export const updateBookController = async (req, res, next) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        const files = req.files || {};

        const book = await updateBookService(id, updateData, files);

        successResponse(
            {
                success: true,
                message: "Book updated successfully",
                data: book,
            },
            res
        );
    } catch (error) {
        console.error("Error in updateBookController:", error);
        next(error);
    }
};

export const deleteBookController = async (req, res, next) => {
    try {
        const { id } = req.params;
        await deleteBookService(id);
        successResponse(
            {
                success: true,
                message: "Book deleted successfully",
                data: null,
            },
            res
        );
    } catch (error) {
        console.error("Error in deleteBookController:", error);
        next(error);
    }
};

export const seedBooksController = async (req, res, next) => {
    try {
        const result = await bulkSeedService();
        successResponse(
            {
                success: true,
                message: `Bulk seeding completed. Added ${result.totalAdded} books.`,
                data: result,
            },
            res
        );
    } catch (error) {
        console.error("Error in seedBooksController:", error);
        next(error);
    }
};
