const Group = require('../schema/groupSchema');
const User = require('../schema/User');

const generateInviteCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
};

const createGroup = async (req, res) => {
    try {
        const { name, userId } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Group name is required' });
        }

        // Check if group name is unique
        const existingGroupByName = await Group.findOne({ name });
        if (existingGroupByName) {
            return res.status(400).json({ error: 'Group name already exists' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        let inviteCode;
        let isUnique = false;

        // Ensure the invite code is unique
        while (!isUnique) {
            inviteCode = generateInviteCode();
            const existingGroupByInviteCode = await Group.findOne({ inviteCode });
            if (!existingGroupByInviteCode) {
                isUnique = true;
            }
        }

        let newGroup = new Group({
            name,
            members: [userId],
            inviteCode // Assign the unique invite code
        });

        newGroup = await newGroup.save();

        // Update group foods with user's preferred foods
        const userPreferredFoods = [
            ...user.preferredFoods.breakfast,
            ...user.preferredFoods.lunch,
            ...user.preferredFoods.dinner
        ];
        newGroup.groupFoods = [...new Set(userPreferredFoods)];

        // Add group to user's groups
        user.groups.push(newGroup._id);

        await Promise.all([newGroup.save(), user.save()]);

        res.status(201).json({
            message: 'Group created successfully',
            group: {
                id: newGroup._id,
                name: newGroup.name,
                inviteCode: newGroup.inviteCode,
            },
        });
    } catch (error) {
        console.error('Error creating group:', error);
        res.status(500).json({ error: 'Failed to create group' });
    }
}

module.exports = { createGroup };
