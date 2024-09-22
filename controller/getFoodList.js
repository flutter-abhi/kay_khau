const FoodItem = require("../schema/FoodItem");

const getFoodList = async (req, res) => {
    try {
        const foodItems = await FoodItem.find();
        res.status(200).json(foodItems);
    } catch (error) {
        console.error('Error fetching food items:', error);
        res.status(500).json({ message: 'Error fetching food items' });
    }
};

module.exports = { getFoodList };

