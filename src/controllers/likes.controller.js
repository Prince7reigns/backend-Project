import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    //TODO: toggle like on video
    if(!mongoose.Types.ObjectId.isValid(videoId)){
        new ApiError(400, "Invalid video id")
    }

    const alreadyLiked = await Like.findOne({
        video:videoId,
        likedBy:req.user?._id
    })

    if(alreadyLiked){
        await Like.findByIdAndDelete(alreadyLiked._id)
        return res
        .status(200)
        .json(new ApiResponse(200,  { isLiked: false },"liked succesfull"))
    }

    await Like.create({
        likedBy:req.user?._id,
        video:videoId
    })

    return res
        .status(200)
        .json(new ApiResponse(200, { isLiked: true }));
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment

    if(!mongoose.Types.ObjectId.isValid(commentId)){
        new ApiError(400, "Invalid comment id")
    }

    const alreadyLiked = await Like.findOne({
        comment:commentId,
        likedBy:req.user?._id
    })

    if(alreadyLiked){
        await Like.findByIdAndDelete(alreadyLiked._id)
        return res
        .status(200)
        .json(new ApiResponse(200,  { isLiked: false },"liked succesfull"))
    }

    await Like.create({
        likedBy:req.user?._id,
        comment:commentId
    })

    return res
    .status(200)
    .json(
        new ApiResponse(200, { isLiked: true })
    )
})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet
 
    if(!mongoose.Types.ObjectId.isValid(tweetId)){
        new ApiError(400, "Invalid tweet id")
    }

    const alreadyLiked = await Like.findOne({
        tweet:tweetId,
        likedBy:req.user?._id
    })

    if(alreadyLiked){
        await Like.findByIdAndDelete(alreadyLiked._id)
        return res
        .status(200)
        .json(new ApiResponse(200,  { isLiked: false },"liked succesfull"))
    }

    await Like.create({
        likedBy:req.user?._id,
        tweet:tweetId
    })

    return res
    .status(200)
    .json(
        new ApiResponse(200, { isLiked: true })
    )
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const likedBy = await Like.find({
        likedBy:req.user?._id
    })

    if(!likedBy){
        res
        .status(200)
        .json(new ApiResponse(200, [],"no video liked by this user"))
    }

    const likedVideosAggegate  = await Like.aggregate([
        {
            $match:{
                likedBy:new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"video",
                foreignField:"_id",
                as:"likedVideos",
                pipeline:[
                   {
                     $lookup:{
                        from:"users",
                        localField:"owner",
                        foreignField:"_id",
                        as:"owner"
                     }
                   },
                   {
                    $unwind: "$ownerDetails",
                   }
                ]
            }
        },
        {
            $unwind: "$likedVideos"
        },
        {
            $sort:-1
        },
        {
            $project:{
                _id: 0,
                likedVideo: {
                    _id: 1,
                    "videoFile.url": 1,
                    "thumbnail.url": 1,
                    owner: 1,
                    title: 1,
                    description: 1,
                    views: 1,
                    duration: 1,
                    createdAt: 1,
                    isPublished: 1,
                    ownerDetails: {
                        username: 1,
                        fullName: 1,
                        "avatar.url": 1,
                    },
                },
            }
        }
    ])
}) 

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}