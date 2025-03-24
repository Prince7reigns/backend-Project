import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const {content} = req.body

    if(!content){
        throw new ApiError(400, "Tweet content is required")
    }

    const tweet = await Tweet.create({
        content:content,
        owner: req.user._id
    })

    if(!tweet){
        throw new ApiError(500, "Failed to create tweet")
    }

    return res
    .status(200)
    .json(ApiResponse.success(200,tweet, "Tweet created successfully"))
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const {tweetiId} = req.params
    const {content} = req.body

    if(!content){
        throw new ApiError(400, "Tweet content is required")
    }

    if(!mongoose.Types.ObjectId.isValid(tweetiId)){
        throw new ApiError(400, "Invalid tweet id")
    }

    const tweet = await Tweet.findById(tweetiId)

    if(!tweet){
        throw new ApiError(404, "Tweet not found")
    }

    if (!req.user || !tweet.owner.equals(req.user._id)) {
        throw new ApiError(403, "You are not the owner of this this tweet");
    }


    const updatedTweet = await Tweet.findByIdAndUpdate(
        tweetiId,
        {
            $set:{
                content:content
            }
        },{new:true}
    )

    if(!updateTweet){
        throw new ApiError(500, "Failed to update tweet")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,updatedTweet, "Tweet updated successfully")
    )
})



const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}