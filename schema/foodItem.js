const mongoose = require('mongoose');

const foodItemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        required: true,
    },
    image: {
        type: String,
        required: true,
    },
    // Add more fields as needed
});

const FoodItem = mongoose.model('FoodItem', foodItemSchema);
module.exports = FoodItem;