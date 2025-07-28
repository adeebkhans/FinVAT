const mongoose = require('mongoose');

const onfidoBaitSchema = new mongoose.Schema({
    // Reference to the user who uploaded the document
    user_id: {
        type: String,
        required: true,
        index: true
    },

    // Company that received the steganographic image
    company: {
        type: String,
        enum: ['creder', 'PayFriend', 'LoanIt'],
        required: true
    },

    // Steganographic image details
    steganographic_image: {
        filename: String,
        path: String, // file path on server
        size: Number, // in bytes
        hidden_message: String, // the company name that was hidden
        created_date: {
            type: Date,
            default: Date.now
        },
        image_capacity: {
            width: Number,
            height: Number,
            max_message_length: Number
        }
    }
}, {
    timestamps: true, // adds createdAt and updatedAt
    collection: 'onfido_baits'
});

// Indexes for better query performance
onfidoBaitSchema.index({ user_id: 1, company: 1 });

module.exports = mongoose.model('OnfidoBait', onfidoBaitSchema);