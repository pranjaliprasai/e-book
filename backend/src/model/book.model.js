import mongoose from "mongoose";

const bookSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, "Book title is required"],
            trim: true,
        },
        author: {
            type: String,
            required: [true, "Author name is required"],
            trim: true,
        },
        genre: {
            type: String,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        isbn: {
            type: String,
            required: [true, "ISBN number is required"],
            unique: true,
            trim: true,
        },
        pdfUrl: {
            type: String,
            required: false,
        },
        coverImageUrl: {
            type: String,
            required: [true, "Cover image is required"],
        },
        externalId: {
            type: String,
            unique: true,
            sparse: true, // Only indexed if exists, helps with mixed data
        },
        isDiscovery: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

const bookModel = mongoose.model("Book", bookSchema);
export default bookModel;
