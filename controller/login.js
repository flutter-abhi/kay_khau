const User = require('../schema/User');

const login = async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ email: username });
    if (!user) {
        return res.status(400).json({ message: 'User not found' });
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
        return res.status(400).json({ message: 'Invalid password' });
    }
    res.status(200).json({ message: 'Logged in successfully', user });
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

        res.status(200).json({ message: 'User created successfully', user: newUser });
    } catch (error) {
        res.status(500).json({ message: 'Error creating user', error: error.message });
    }
};

module.exports = { login, signup };
