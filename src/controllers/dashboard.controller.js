import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    const userId = req.user._id

    const totalSubscribers = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(userId)
             }
        },
        {
            $group:{
                _id: null, // null means all docs will group to gether
                totalSubscribers:{$sum:1}
            }
        }
    ])

    const video = await Video.aggregate([
        {
            $match: {
                owner:new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup:{
                from:"likes",
                localField:"_id",
                foreignField:"video",
                as:"likes"
            }
        },
        {
          $project:{
            totalLike:{
                $size:"$likes"
            },
             totalViews: "$views",
             totalVideos: 1
          }
        },
        {
            $group:{
                _id: null,
                totalVideos:{$sum:1},
                totalLikes:{$sum:"$totalLike"},
                totalViews:{$sum:"$totalViews"}               
            }
        }
    ])
})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
})

export {
    getChannelStats, 
    getChannelVideos
    }