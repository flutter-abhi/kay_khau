const FoodItem = require('../schema/FoodItem');

const addFoodItems = async (req, res) => {
    try {
        const { name, image, type } = req.body;
        const foodItem = new FoodItem({ name, image, type });
        await foodItem.save();
        res.status(201).json(foodItem);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { addFoodItems };