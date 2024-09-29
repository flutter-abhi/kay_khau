const User = require('../schema/User');

const login = async (req, res) => {
    const { email, password } = req.body;
    console.log(email, password);

    try {
        const populatedUser = await User.findOne({ email })
            .populate({
                path: 'groups',
                populate: [
                    {
                        path: 'groupFoods',
                        model: 'FoodItem'
                    },
                    {
                        path: 'dailyChoices',
                        populate: {
                            path: 'breakfast.foodItem lunch.foodItem dinner.foodItem',
                            model: 'FoodItem'
                        }
                    }
                ]
            });

        if (!populatedUser) {
            return res.status(400).json({ message: 'User not found' });
        }
        const isMatch = (populatedUser.password === password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid password' });
        }
        res.status(200).json({ message: 'Logged in successfully', user: populatedUser });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
};

const signup = async (req, res) => {
    const { email, password } = req.body;

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already exists' });
        }

        const newUser = new User({ email, password });
        await newUser.save();

        const populatedUser = await User.findById(newUser._id)
            .populate({
                path: 'groups',
                populate: [
                    {
                        path: 'groupFoods',
                        model: 'FoodItem'
                    },
                    {
                        path: 'dailyChoices',
                        populate: {
                            path: 'breakfast.foodItem lunch.foodItem dinner.foodItem',
                            model: 'FoodItem'
                        }
                    }
                ]
            });

        res.status(200).json({ message: 'User created successfully', user: populatedUser });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ message: 'Error creating user', error: error.message });
    }
};

module.exports = { login, signup };
