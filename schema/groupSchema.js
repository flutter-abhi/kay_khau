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
            voteNumber: { type: Number, default: 0 }
        }],
        lunch: [{
            foodItem: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodItem' },
            votes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
            voteNumber: { type: Number, default: 0 }
        }],
        dinner: [{
            foodItem: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodItem' },
            votes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
            voteNumber: { type: Number, default: 0 }
        }],
    }],
});

groupSchema.methods.decideTodaysMeal = function(date, meal) {
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

    return winningChoice.foodItem;
};

const Group = mongoose.model('Group', groupSchema);

module.exports = Group;