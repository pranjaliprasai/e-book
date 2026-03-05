import bookModel from "../model/book.model.js";
import { AppError } from "../utils/error.js";
import fs from "fs";
import path from "path";

export const addBookService = async (bookData) => {
    try {
        const { title, author, genre, description, isbn, pdfUrl, coverImageUrl } = bookData;

        // Check if ISBN already exists
        const existingBook = await bookModel.findOne({ isbn });
        if (existingBook) {
            throw new AppError("A book with this ISBN already exists", 400);
        }

        const newBook = await bookModel.create({
            title,
            author,
            genre,
            description,
            isbn,
            pdfUrl,
            coverImageUrl,
        });

        return newBook;
    } catch (error) {
        console.error("Error in addBookService:", error);
        throw error;
    }
};

export const getBookByIdService = async (id) => {
    try {
        const book = await bookModel.findById(id);
        if (!book) {
            throw new AppError("Book not found", 404);
        }
        return book;
    } catch (error) {
        console.error("Error in getBookByIdService:", error);
        throw error;
    }
};

export const getAllBooksService = async (genre, isDiscovery, limit, search, source) => {
    try {
        const query = {};
        if (genre) query.genre = genre;

        // Only apply isDiscovery filter when NOT doing a text search
        // (search should sweep ALL books regardless of discovery status)
        if (!search && isDiscovery !== undefined) {
            const isDiscVal = isDiscovery === 'true' || isDiscovery === true;
            if (isDiscVal) {
                query.isDiscovery = true;
            } else {
                // Return books where isDiscovery is explicitly false OR missing/undefined
                query.isDiscovery = { $ne: true };
            }
        }

        // Filter by source (Gutenberg or OpenLibrary) based on ISBN prefix
        if (source) {
            if (source.toLowerCase() === 'gutenberg') {
                query.isbn = { $regex: /^GUT-/ };
            } else if (source.toLowerCase() === 'openlibrary') {
                query.isbn = { $regex: /^OL-/ };
            }
        }

        if (search) {
            const trimmedSearch = search.trim();
            query.$or = [
                { title: { $regex: trimmedSearch, $options: 'i' } },
                { author: { $regex: trimmedSearch, $options: 'i' } },
                { genre: { $regex: trimmedSearch, $options: 'i' } }
            ];
        }

        console.log("[DB] => Executing Mongo Query:", JSON.stringify(query));
        let mongoQuery = bookModel.find(query).sort({ createdAt: -1 });
        if (limit) {
            mongoQuery = mongoQuery.limit(parseInt(limit, 10));
        }

        console.log("[DB] => Awaiting Mongo...");
        const books = await mongoQuery;
        console.log(`[DB] <= Mongo Returned ${books?.length} documents`);
        return books;
    } catch (error) {
        console.error("Error in getAllBooksService:", error);
        throw error;
    }
};

export const updateBookService = async (id, updateData, files) => {
    try {
        const book = await bookModel.findById(id);
        if (!book) {
            throw new AppError("Book not found", 404);
        }

        // Handle file updates: delete old files if new ones are uploaded
        if (files.pdf) {
            if (fs.existsSync(book.pdfUrl)) {
                fs.unlinkSync(book.pdfUrl);
            }
            book.pdfUrl = files.pdf[0].path;
        }

        if (files.coverImage) {
            if (fs.existsSync(book.coverImageUrl)) {
                fs.unlinkSync(book.coverImageUrl);
            }
            book.coverImageUrl = files.coverImage[0].path;
        }

        // Update other fields
        book.title = updateData.title || book.title;
        book.author = updateData.author || book.author;
        book.genre = updateData.genre || book.genre;
        book.description = updateData.description || book.description;

        // Check ISBN uniqueness if it's being updated
        if (updateData.isbn && updateData.isbn !== book.isbn) {
            const existingBook = await bookModel.findOne({ isbn: updateData.isbn });
            if (existingBook) {
                throw new AppError("A book with this ISBN already exists", 400);
            }
            book.isbn = updateData.isbn;
        }

        await book.save();
        return book;
    } catch (error) {
        console.error("Error in updateBookService:", error);
        throw error;
    }
};

export const deleteBookService = async (id) => {
    try {
        console.log(`--- Backend: Deleting Book ID: ${id} ---`);
        const book = await bookModel.findById(id);
        if (!book) {
            console.warn(`Book with ID ${id} not found in database`);
            throw new AppError("Book not found", 404);
        }

        console.log(`Book found: ${book.title}. Checking files...`);

        // Delete associated files if they are local paths
        if (book.pdfUrl && !book.pdfUrl.startsWith("http")) {
            console.log(`Checking PDF file: ${book.pdfUrl}`);
            if (fs.existsSync(book.pdfUrl)) {
                console.log(`Deleting PDF: ${book.pdfUrl}`);
                fs.unlinkSync(book.pdfUrl);
            }
        }
        if (book.coverImageUrl && !book.coverImageUrl.startsWith("http")) {
            console.log(`Checking Cover image: ${book.coverImageUrl}`);
            if (fs.existsSync(book.coverImageUrl)) {
                console.log(`Deleting Cover: ${book.coverImageUrl}`);
                fs.unlinkSync(book.coverImageUrl);
            }
        }

        await bookModel.findByIdAndDelete(id);
        console.log("Book successfully deleted from database");
        return true;
    } catch (error) {
        console.error("Error in deleteBookService:", error);
        throw error;
    }
};
export const importBookService = async (bookData) => {
    try {
        const { title, author, isbn, genre, description, coverImageUrl, pdfUrl, externalId } = bookData;

        // Check if book already exists by externalId (priority) or ISBN
        let existingBook = null;
        if (externalId) {
            existingBook = await bookModel.findOne({ externalId });
        }

        if (!existingBook && isbn) {
            existingBook = await bookModel.findOne({ isbn });
        }

        if (existingBook) {
            if (existingBook.isDiscovery) {
                existingBook.isDiscovery = false;
                await existingBook.save();
                return existingBook;
            }
            throw new AppError("This book is already in your collection", 400);
        }

        const newBook = await bookModel.create({
            title,
            author,
            isbn,
            genre: genre || "General",
            description: description || "",
            coverImageUrl,
            pdfUrl: pdfUrl || "",
            externalId: externalId || null,
        });

        return newBook;
    } catch (error) {
        console.error("Error in importBookService:", error);
        throw error;
    }
};
