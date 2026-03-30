import mongoose from 'mongoose';

const highlightSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    bookId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Book',
        required: true
    },
    text: {
        type: String,
        required: true
    },
    rangeData: {
        type: Object, // Stores serialized range info (offsets, selectors)
        required: true
    },
    color: {
        type: String,
        default: '#FFFF00' // Yellow
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Add index for fast lookup
highlightSchema.index({ userId: 1, bookId: 1 });

export default mongoose.model('Highlight', highlightSchema);
