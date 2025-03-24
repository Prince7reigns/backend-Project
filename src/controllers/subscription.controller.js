import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    // TODO: toggle subscription

    if(!mongoose.Types.ObjectId.isValid(channelId)){
        throw new ApiError(400, "Invalid Channel ID")
    }

    const isSubscribe = await Subscription.findOne({
        channelId: channelId,
        userId: req.user?._id
    })

    if(isSubscribe){
        await Subscription.findByIdAndDelete(channel._id)
        return res
        .status(200)
        .json(new ApiResponse(200,{ subscribed: false }, "unsubscribed successfully", ))
    }

    await Subscription.create({
        userId: req.user?._id,
        channelId: channelId
    })

    return res
    .status(200)
    .json(new ApiResponse (200,{ subscribed: false }, "subscribed successfully"))
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params

    if(!mongoose.Types.ObjectId.isValid(channelId)){
        throw new ApiError(400, "Invalid Channel ID")
    }

    const subscriberList = Subscription.aggregate([
        {
            $match:{
                channelId: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup:{
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscriber",
                pipeline:[
                    {
                        $lookup:{
                            from:"subscriptions",
                            localField: "_id",
                            foreignField: "channel",
                            as: "subscribedToSubscriber",
                        }
                    },
                    {
                        $addFeilds:{
                            subscribedToSubscriber:{
                                cond:{
                                    if:{
                                        $in:[
                                            channelId,
                                            "$subscribedToSubscriber.subscriber"
                                        ]
                                    },
                                    then: true,
                                    else: false,
                                }
                            },
                            subscribersCount: { $size: "$subscribedToSubscriber" }
                        }
                    }
                ]
            }
        },
        {
            $unwind:"$subscriber"
        },
        {
            $project:{
                _id:0,
                subscriber:{
                    _id: 1,
                    username: 1,
                    fullName: 1,
                    "avatar.url": 1,
                    subscribedToSubscriber: 1,
                    subscribersCount: 1,
                }
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(200,subscriberList, "subscribers fetched successfully")
    )
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params

    if(!mongoose.Types.ObjectId.isValid(subscriberId)){
        throw new ApiError(400,"Invalid subscriber ID")
    }

    const subscribedChannels = Subscription.aggregate([
        {
            $match:{
                subscriber:new mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
            $lookup:{
                from: "user",
                localField: "channel",
                foreignField: "_id",
                as: "subscribedChannel",
                pipeline:[
                    {
                        from:"videos",
                        localField:"_id",
                        foreignField:"owner",
                        as:"videos"
                    },
                    {
                        $addFeilds:{
                            latestVideo:{
                                $last:"$videos"
                            },
                            subscribedChannelcount:{
                                $size:"$subscribedChannel"
                            }
                        }
                    }
                ]
            }
        },
        {
           $unwind:"$subscribedChannel"
        },
        {
            $project:{
                _id:0,
                subscribedChannel:{
                    _id:1,
                    username:1,
                    fullName:1,
                    "avatar.url":1,
                    latestVideo:{
                        _id:1,
                        title:1,
                        "thumbnail.url":1,
                        description:1,
                        duration:1,
                        views:1,
                        createdAt: 1,
                        owner:1
                    }
                }
            }
        }
    ])

    return res
    .status(200)
    .json(new ApiResponse(200,subscribedChannels, "subscribed channels fetched successfully"))
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}