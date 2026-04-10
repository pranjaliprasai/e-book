import bookModel from "../model/book.model.js";
import userModel from "../model/user.model.js";
import highlightModel from "../model/highlight.model.js";
import progressModel from "../model/progress.model.js";
import { AppError } from "../utils/error.js";
import fs from "fs";
import path from "path";
import mongoose from "mongoose";

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

export const getBookByIdService = async (bookId, user) => {
    try {
        const book = await bookModel.findById(bookId);
        if (!book) {
            throw new AppError("Book not found", 404);
        }

        // Admins can see everything
        if (user && user.role === 'admin') {
            return book;
        }

        const bookObj = book.toObject();

        if (user) {
            const fullUser = await userModel.findById(user.userId);
            if (!fullUser) throw new AppError("User not found", 404);

            const isSubscribed = fullUser.isSubscribed &&
                fullUser.subscriptionExpiry &&
                (new Date(fullUser.subscriptionExpiry) > new Date());

            const FREE_BOOK_LIMIT = 14;
            const bookIdStr = bookId.toString();
            const userReadBooks = fullUser.readBooks || [];
            const alreadyRead = userReadBooks.some(id => id && id.toString() === bookIdStr);

            console.log(`[Book Service] User: ${fullUser.email} | Read: ${userReadBooks.length} | AlreadyRead: ${alreadyRead} | Limit: ${FREE_BOOK_LIMIT}`);

            if (!isSubscribed) {
                if (alreadyRead) {
                    return bookObj;
                } else if (userReadBooks.length >= FREE_BOOK_LIMIT) {
                    console.log(`[Book Service] Locking book for ${fullUser.email} (Limit reached)`);
                    bookObj.pdfUrl = ""; // Remove PDF URL
                    bookObj.isLocked = true;
                    return bookObj;
                } else {
                    // Add to readBooks
                    console.log(`[Book Service] Allowing new book read for ${fullUser.email}`);
                    if (!fullUser.readBooks) fullUser.readBooks = [];
                    fullUser.readBooks.push(bookId);
                    await fullUser.save();
                    return bookObj;
                }
            }
        }

        return bookObj;
    } catch (error) {
        console.error("Error in getBookByIdService:", error);
        throw error;
    }
};

export const getAllBooksService = async (genre, isDiscovery, limit, search, source, page = 1) => {
    try {
        const query = {};
        if (genre) query.genre = genre;

        // Only apply isDiscovery filter when NOT doing a text search OR specific category lookup
        // (If source or genre is provided, user wants specific category content regardless of discovery status)
        if (isDiscovery !== undefined) {
            const isDiscVal = isDiscovery === 'true' || isDiscovery === true;
            query.isDiscovery = isDiscVal;
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
        
        // Get total count for pagination
        const total = await bookModel.countDocuments(query);
        
        let mongoQuery = bookModel.find(query).sort({ createdAt: -1 });
        
        if (limit) {
            const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
            mongoQuery = mongoQuery.skip(skip).limit(parseInt(limit, 10));
        }

        console.log("[DB] => Awaiting Mongo...");
        const books = await mongoQuery;
        console.log(`[DB] <= Mongo Returned ${books?.length} documents out of ${total}`);
        
        return {
            books,
            total,
            page: parseInt(page, 10),
            totalPages: limit ? Math.ceil(total / parseInt(limit, 10)) : 1
        };
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

        console.log(`Book found: ${book.title}. Starting cleanup...`);

        // 1. Delete associated files (pdf & coverImageUrl) if they are local paths
        // We use try-catch here so that if the file is already gone, the DB deletion still proceeds.
        const deleteFile = (filePath, type) => {
            if (filePath && !filePath.startsWith("http")) {
                try {
                    const fullPath = path.resolve(filePath);
                    if (fs.existsSync(fullPath)) {
                        console.log(`Deleting ${type}: ${fullPath}`);
                        fs.unlinkSync(fullPath);
                    } else {
                        console.log(`${type} not found at ${fullPath}, skipping unlink`);
                    }
                } catch (err) {
                    console.error(`Failed to delete ${type} at ${filePath}:`, err.message);
                    // We don't throw here, just log and continue
                }
            }
        };

        deleteFile(book.pdfUrl, "PDF");
        deleteFile(book.coverImageUrl, "Cover Image");

        // 2. Cascade cleanup in other models
        console.log("Cleaning up user references and associated data...");
        
        const bookObjectId = new mongoose.Types.ObjectId(id);

        await Promise.all([
            // Remove from User.favorites
            userModel.updateMany(
                { favorites: bookObjectId },
                { $pull: { favorites: bookObjectId } }
            ),
            // Remove from User.readBooks
            userModel.updateMany(
                { readBooks: bookObjectId },
                { $pull: { readBooks: bookObjectId } }
            ),
            // Delete all highlights for this book
            highlightModel.deleteMany({ bookId: bookObjectId }),
            
            // Delete reading progress for this book
            progressModel.deleteMany({ book: bookObjectId })
        ]);

        // 3. Finally delete the book document
        await bookModel.findByIdAndDelete(id);
        console.log("Book successfully deleted from database and cleanup complete.");
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
