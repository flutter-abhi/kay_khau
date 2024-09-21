const User = require('../schema/User');

const addPreferenceList = async (req, res) => {
  try {
    const { userId, breakfast, lunch, dinner } = req.body;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.preferredFoods.breakfast.length > 0 || user.preferredFoods.lunch.length > 0 || user.preferredFoods.dinner.length > 0) {
      return res.status(400).json({ message: 'Preference list already exists' });
    }

    user.preferredFoods = {
      breakfast: breakfast || [],
      lunch: lunch || [],
      dinner: dinner || []
    };
    await user.save();

    res.status(201).json({ message: 'Preference list added successfully' });
  } catch (error) {
    console.error('Error adding preference list:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { addPreferenceList };
