const Group = require('../schema/groupSchema');
const User = require("../schema/User");

const joinGroup = async (req, res) => {
    try {
        const { inviteCode } = req.body;
        const { userId } = req.body; // Assuming you have user auth middleware

        const group = await Group.findOne({ inviteCode });
        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (group.members.includes(user._id)) {
            return res.status(400).json({ message: 'User already in group' });
        }

        await group.members.push(user._id);
        await group.save();

        // Add group to user's groups
        user.groups.push(group._id);
        await user.save();

        const userPreferredFoods = [
            ...user.preferredFoods.breakfast,
            ...user.preferredFoods.lunch,
            ...user.preferredFoods.dinner
        ];

        group.groupFoods = [...new Set(userPreferredFoods)];
        await group.save();

        res.status(200).json({ message: 'Joined group successfully', group });
    } catch (error) {
        console.error('Error joining group:', error);
        res.status(500).json({ message: 'Error joining group' });
    }
}

module.exports = { joinGroup };
