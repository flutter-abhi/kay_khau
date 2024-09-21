const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    preferredFoods: {
        breakfast: [{ type: mongoose.Schema.Types.ObjectId, ref: 'FoodItem' }],
        lunch: [{ type: mongoose.Schema.Types.ObjectId, ref: 'FoodItem' }],
        dinner: [{ type: mongoose.Schema.Types.ObjectId, ref: 'FoodItem' }],
    },
    groups: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Group' }],
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const User = mongoose.model('User', userSchema);

module.exports = User;