const Group = require('../schema/groupSchema');

const getGroupData = async (socket, groupId) => {
  try {
    const group = await Group.findById(groupId)
      .populate('members')
      .populate('dailyChoices.breakfast.foodItem')
      .populate('dailyChoices.lunch.foodItem')
      .populate('dailyChoices.dinner.foodItem');

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

const vote = async (io, socket, { groupId, date, meal, foodItemId, userId }) => {
  try {
    console.log(`Vote attempt: groupId=${groupId}, date=${date}, meal=${meal}, foodItemId=${foodItemId}, userId=${userId}`);

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

    // Find or create the food choice in the daily choice
    let foodChoice = dailyChoice[meal].find(choice => choice.foodItem.toString() === foodItemId);
    if (!foodChoice) {
      foodChoice = { foodItem: groupFoodItem._id, votes: [], voteNumber: 0 };
      dailyChoice[meal].push(foodChoice);
    }

    // Update vote
    const userVoteIndex = foodChoice.votes.indexOf(userId);
    if (userVoteIndex > -1) {
      // Remove vote
      foodChoice.votes.splice(userVoteIndex, 1);
      foodChoice.voteNumber--;
    } else {
      // Add vote
      foodChoice.votes.push(userId);
      foodChoice.voteNumber++;
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

module.exports = { getGroupData, vote };
