const User = require('../models/userModel')
const Message = require('../models/messageModel')
const Player = require('../models/playerModel')
const asyncHandler = require('express-async-handler')


const getAllMessagesFromPlayer = asyncHandler(async (req, res) => {
        const { id, player} = req.body

        const messages = await Message.find()
        const messagesWithPlayerAndOwner = await Promise.all(messages.map(async (message) => {
            return {...messagesWithPlayerAndOwner, player: player, owner:  id}
    }))

    res.status(201).json(messagesWithPlayerAndOwner)
})


const createNewMessage = asyncHandler(async (req, res) => {
    const { id, player, draft, imageOne, imageTwo, imageThree, price, quantity, points, promo, promoLineOne, promoLineTwo, disclaimerLineOne, disclaimerLineTwo } = req.body
  
    // Confirm data
    if (!player || !imageOne || !imageTwo || !imageThree || !price || !quantity || !points || !promo || !promoLineOne || !promoLineTwo || !disclaimerLineOne || !disclaimerLineTwo) {
      return res.status(400).json({ message: 'All fields are required' });
    }
  
    // Create and store the new Player
    const message = new Message({
      owner: id,
      player: player,
      draft: draft,
      imageOne: imageOne,
      imageTwo: imageTwo,
      imageThree: imageThree,
      price: price,
      quantity: quantity,
      promo: promo,
      points: points,
      promoLineOne: promoLineOne,
      promoLineTwo: promoLineTwo,
      disclaimerLineOne: disclaimerLineOne,
      disclaimerLineTwo: disclaimerLineTwo
    })
  
    // check if draft
    const isDraft = draft
  
    if (!isDraft) {
      // check if player exist
      const existingPlayer = await Player.findOne({ _id: player }).lean().exec();
  
      if (!existingPlayer) {
        return res.status(409).json({ Message: 'Player Does Not Exist' });
      }
      const newMessage = await message.save()
      const foundPlayer = await Player.findById(player);
      foundPlayer.playlist.push(newMessage._id);
      foundPlayer.save()
      res.status(201).json(newMessage)
    } else if (isDraft) {
      const newMessage = await message.save()
      const foundUser = await User.findById(id);
      foundUser.drafts.push(newMessage._id);
      foundUser.save()
      res.status(201).json(newMessage)
    }
  
  });
  

const updateMessage = asyncHandler(async (req, res) => {
    const { id, player, draft, imageOne, imageTwo, imageThree, price, quantity, points, promo, promoLineOne, promoLineTwo, disclaimerLineOne, disclaimerLineTwo } = req.body

    // Confirm data
    if (!id || !player|| !imageOne || !imageTwo || !imageThree || !price || !quantity || !points || !promo || !promoLineOne || !promoLineTwo || !disclaimerLineOne || !disclaimerLineTwo) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    // Find and update the existing message
    const existingMessage = await Message.findById(id).exec();
    if (!existingMessage) {
        return res.status(404).json({ message: 'Message not found' });
    }

    existingMessage.player = player;
    existingMessage.draft = draft;
    existingMessage.imageOne = imageOne;
    existingMessage.imageTwo = imageTwo;
    existingMessage.imageThree = imageThree;
    existingMessage.price = price;
    existingMessage.quantity = quantity;
    existingMessage.points = points;
    existingMessage.promo = promo;
    existingMessage.promoLineOne = promoLineOne;
    existingMessage.promoLineTwo = promoLineTwo;
    existingMessage.disclaimerLineOne = disclaimerLineOne;
    existingMessage.disclaimerLineTwo = disclaimerLineTwo;

    const updatedMessage = await existingMessage.save();

    // check if draft
    const isDraft = draft

    if (!isDraft) {
        // check if player exists
        const existingPlayer = await Player.findById(player).lean().exec();

        if (!existingPlayer) {
            return res.status(409).json({ message: 'Player Does Not Exist' });
        }

        // remove message from old player's playlist if it exists
        const oldPlayer = await Player.findById(existingMessage.player);
        const index = oldPlayer.playlist.indexOf(existingMessage._id);
        if (index > -1) {
            oldPlayer.playlist.splice(index, 1);
            await oldPlayer.save();
        }

        // add message to the new player's playlist
        const newPlayer = await Player.findById(player);
        newPlayer.playlist.push(existingMessage._id);
        await newPlayer.save();
    }

    res.status(200).json(updatedMessage);
});


const deleteMessage = asyncHandler(async (req, res) => {
    

    // Find message to delete
    const messageToDelete = await Message.findById(req.query.message).exec()

    if (!messageToDelete) {
        return res.status(404).json({ message: 'Message not found' })
    }

    // Remove message from playlists
    await Player.updateMany(
        { playlist: messageToDelete._id },
        { $pull: { playlist: messageToDelete._id } }
    ).exec()

    // Delete message
    const deleteResult = await messageToDelete.deleteOne()

    res.json(deleteResult)
})


module.exports = {
  deleteMessage,
  createNewMessage,
  getAllMessagesFromPlayer,
  updateMessage,
 }