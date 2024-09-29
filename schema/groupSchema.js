const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    inviteCode: {
        type: String,
        required: true,
        unique: true,
        length: 6,
        uppercase: true,
    },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    groupFoods: [{ type: mongoose.Schema.Types.ObjectId, ref: 'FoodItem' }],
    dailyChoices: [{
        date: Date,
        breakfast: [{
            foodItem: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodItem' },
            votes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
            voteNumber: { type: Number, default: 1 }
        }],
        lunch: [{
            foodItem: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodItem' },
            votes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
            voteNumber: { type: Number, default: 1 }
        }],
        dinner: [{
            foodItem: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodItem' },
            votes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
            voteNumber: { type: Number, default: 1 }
        }],
    }],
});

groupSchema.methods.decideTodaysMeal = function (date, meal) {
    const dailyChoice = this.dailyChoices.find(choice =>
        choice.date.toDateString() === date.toDateString()
    );

    if (!dailyChoice) {
        return null;
    }

    const mealChoices = dailyChoice[meal];
    if (!mealChoices || mealChoices.length === 0) {
        return null;
    }

    // Find the choice with the highest vote number
    const winningChoice = mealChoices.reduce((prev, current) =>
        (prev.voteNumber > current.voteNumber) ? prev : current
    );

    // Return null if there are no votes
    return winningChoice.voteNumber > 0 ? winningChoice.foodItem : null;
};

groupSchema.methods.toggleVote = function (date, meal, foodItemId, userId) {
    let dailyChoice = this.dailyChoices.find(choice =>
        choice.date.toDateString() === date.toDateString()
    );

    if (!dailyChoice) {
        dailyChoice = { date: date, breakfast: [], lunch: [], dinner: [] };
        this.dailyChoices.push(dailyChoice);
    }

    let foodChoice = dailyChoice[meal].find(choice => choice.foodItem.toString() === foodItemId);
    if (!foodChoice) {
        foodChoice = { foodItem: foodItemId, votes: [], voteNumber: 1 };
        dailyChoice[meal].push(foodChoice);
    }

    const userVoteIndex = foodChoice.votes.indexOf(userId);
    if (userVoteIndex === -1) {
        // Add vote
        foodChoice.votes.push(userId);
        foodChoice.voteNumber++;
        return true; // Vote added
    } else {
        // Remove vote
        foodChoice.votes.splice(userVoteIndex, 1);
        foodChoice.voteNumber--;
        return false; // Vote removed
    }
};

const Group = mongoose.model('Group', groupSchema);

module.exports = Group;