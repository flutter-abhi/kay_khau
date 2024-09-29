const Group = require('../schema/groupSchema');

const getGroupData = async (socket, groupId) => {
  try {
    const group = await Group.findById(groupId)
      .populate('dailyChoices.breakfast.foodItem')
      .populate('dailyChoices.lunch.foodItem')
      .populate('dailyChoices.dinner.foodItem')
      .populate('groupFoods');

    if (!group) {
      socket.emit('groupData', { error: 'Group not found' });
      return;
    }

    socket.emit('groupData', { group });
    socket.join(groupId);
  } catch (error) {
    console.error('Error fetching group data:', error);
    socket.emit('groupData', { error: 'Error fetching group data' });
  }
};

const addVote = async (io, socket, { groupId, date, meal, foodItemId, userId }) => {
  try {
    const group = await Group.findById(groupId);
    if (!group) {
      console.log(`Error: Group not found for groupId=${groupId}`);
      socket.emit('voteResult', { error: 'Group not found' });
      return;
    }

    const voteDate = new Date(date);
    console.log('Vote date:', voteDate.toISOString());

    // Find or create dailyChoice for the vote date
    let dailyChoice = group.dailyChoices.find(choice =>
      choice.date.toDateString() === voteDate.toDateString()
    );
    if (!dailyChoice) {
      dailyChoice = { date: voteDate, breakfast: [], lunch: [], dinner: [] };
      group.dailyChoices.push(dailyChoice);
    }

    // Find the food item in groupFood
    const groupFoodItem = group.groupFoods.find(food => food._id.toString() === foodItemId);
    if (!groupFoodItem) {
      console.log(`Error: Invalid food item. foodItemId=${foodItemId}`);
      socket.emit('voteResult', { error: 'Invalid food item' });
      return;
    }

    // Find or create the food choice
    let foodChoice = dailyChoice[meal].find(choice => choice.foodItem.toString() === foodItemId);
    if (!foodChoice) {
      foodChoice = { foodItem: groupFoodItem._id, votes: [userId], voteNumber: 1 };
      dailyChoice[meal].push(foodChoice);
    }

    // Add vote if user hasn't voted yet
    if (!foodChoice.votes.includes(userId)) {
      foodChoice.votes.push(userId);
      foodChoice.voteNumber += 1;
      console.log(`Vote added for user ${userId}, new vote count: ${foodChoice.voteNumber}`);
    } else {
      console.log(`User ${userId} has already voted for this item`);
    }

    await group.save();

    // Decide today's meal after voting
    const todaysMeal = await group.decideTodaysMeal(voteDate, meal);

    // Emit updated group data to all sockets in the group room
    io.to(groupId).emit('groupUpdate', { group, todaysMeal });
    socket.emit('voteResult', { success: true });

    // Fetch updated group data and send it to the client
    getGroupData(socket, groupId);
  } catch (error) {
    console.error('Error processing vote:', error);
    console.log('Vote details:', { groupId, date, meal, foodItemId, userId });
    socket.emit('voteResult', { error: 'Error processing vote' });
  }
};

const removeVote = async (io, socket, { groupId, date, meal, foodItemId, userId }) => {
  try {
    const group = await Group.findById(groupId);
    if (!group) {
      console.log(`Error: Group not found for groupId=${groupId}`);
      socket.emit('voteResult', { error: 'Group not found' });
      return;
    }

    const voteDate = new Date(date);
    console.log('Remove vote date:', voteDate.toISOString());

    // Find dailyChoice for the vote date
    let dailyChoice = group.dailyChoices.find(choice =>
      choice.date.toDateString() === voteDate.toDateString()
    );
    if (!dailyChoice) {
      console.log('No daily choice found for the given date');
      socket.emit('voteResult', { error: 'No vote found to remove' });
      return;
    }

    // Find the food choice
    let foodChoice = dailyChoice[meal].find(choice => choice.foodItem.toString() === foodItemId);
    if (!foodChoice) {
      console.log(`Error: No vote found for foodItemId=${foodItemId}`);
      socket.emit('voteResult', { error: 'No vote found to remove' });
      return;
    }

    // Remove vote if user has voted
    const voteIndex = foodChoice.votes.indexOf(userId);
    if (voteIndex !== -1) {
      foodChoice.votes.splice(voteIndex, 1);
      foodChoice.voteNumber--;

      // Remove food choice if no votes left
      if (foodChoice.votes.length === 0) {
        dailyChoice[meal] = dailyChoice[meal].filter(choice => choice.foodItem.toString() !== foodItemId);
      }

      await group.save();

      // Decide today's meal after removing vote
      const todaysMeal = await group.decideTodaysMeal(voteDate, meal);

      // Emit updated group data to all sockets in the group room
      io.to(groupId).emit('groupUpdate', { group, todaysMeal });
      socket.emit('voteResult', { success: true });

      // Fetch updated group data and send it to the client
      getGroupData(socket, groupId);
    } else {
      socket.emit('voteResult', { error: 'No vote found to remove' });
    }
  } catch (error) {
    console.error('Error removing vote:', error);
    console.log('Vote removal details:', { groupId, date, meal, foodItemId, userId });
    socket.emit('voteResult', { error: 'Error removing vote' });
  }
};

const checkVote = async (io, socket, voteData) => {
  const { groupId, date, meal, foodItemId, userId } = voteData;

  try {
    // Check if meal is undefined
    if (!meal) {
      console.log('Error: Meal is undefined');``
      socket.emit('voteStatus', { error: 'Meal is undefined' });
      return;
    }

    const group = await Group.findById(groupId);
    if (!group) {
      console.log(`Error: Group not found for groupId=${groupId}`);
      socket.emit('voteStatus', { error: 'Group not found' });
      return;
    }

    const voteDate = new Date(date);
    console.log('Check vote date:', voteDate.toISOString());

    const dailyChoice = group.dailyChoices.find(choice =>
      choice.date.toDateString() === voteDate.toDateString()
    );

    if (!dailyChoice) {
      console.log('No daily choice found for the given date');
      socket.emit('voteStatus', { hasVoted: false });
      return;
    }

    // Check if the meal property exists in dailyChoice
    if (!dailyChoice[meal]) {
      console.log(`Error: Invalid meal type '${meal}'`);
      socket.emit('voteStatus', { error: 'Invalid meal type' });
      return;
    }

    const foodChoice = dailyChoice[meal].find(choice =>
      choice.foodItem.toString() === foodItemId
    );

    const hasVoted = foodChoice ? foodChoice.votes.includes(userId) : false;
    console.log(`User ${userId} has voted: ${hasVoted}`);
    socket.emit('voteStatus', { hasVoted });
  } catch (error) {
    console.error('Error checking vote:', error);
    socket.emit('voteStatus', { error: 'Error checking vote' });
  }
};

module.exports = { getGroupData, addVote, removeVote, checkVote };
