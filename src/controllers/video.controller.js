
import mongoose, {isValidObjectId, Types} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import asyncHandler from "../utils/asyncHandler.js"
import {deleteOnCloudinary, uploadOnCloudinary} from "../utils/cloudinary.js"
import { Like } from "../models/likes.model.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination

    // for using Full Text based search u need to create a search index in mongoDB atlas
    // you can include field mapppings in search index eg.title, description, as well
    // Field mappings specify which fields within your documents should be indexed for text search.
    // this helps in seraching only in title, desc providing faster search results
    // here the name of search index is 'search-videos'

    
    const pipeline = [];

    if(query){
        pipeline.push({
            $search:{
                indexName: "search-video",
                text: {
                    query:query,
                    path: ["title", "description"],
                }
            }
        })
    }

    if(userId){
        if(!isValidObjectId(userId)){
            return new ApiError(400, "Invalid user id")
        }

        pipeline.push({
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        })
    }

    pipeline.push({ $match : { isPublished:true } } )

    if(sortBy && sortType){
        pipeline.push({
            $sort: {
                [sortBy]: sortType === "asc" ? 1 : -1
            }
        })
    }else{
        pipeline.push({
            $sort: {
                createdAt: -1
            } 
        })
    }

    pipeline.push({
        $lookup:{
            from: "users",
            localField: "owner",
            foreignField: "_id",
            as: "ownerDetails",
            pipeline:[{
                $project:{
                    userName:1,
                    "avatar.url":1
                }
            }]
        }
    },{$unwind:"$ownerDetails"})

    const videoAggregate = await Video.aggregate(pipeline)

    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10)
    };

    const video = Video.aggregatePaginate(videoAggregate,options)

    res
    .status(200)
    .json(new ApiResponse(200,video,"Videos fetched successfully"))
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video
  
    if(
        [title, description].some((field)=>field?.trim()==="")
    ){
        throw new ApiError(400,"all feilds are required")
    }

    console.log(req.files)
    

    const videoFileLocalPath = req.files?.videoFile[0]?.path
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path

    if (!videoFileLocalPath) {
        throw new ApiError(400, "videoFileLocalPath is required");
    }

    if (!thumbnailLocalPath) {
        throw new ApiError(400, "thumbnailLocalPath is required");
    }

    const videoFile = await uploadOnCloudinary(videoFileLocalPath)
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

    const video = await Video.create({
        title,
        description,
        videoFile:{
            url:videoFile.url,
            public_id:videoFile.public_id
        },
        thumbnail:{
            url:thumbnail.url,
            public_id:thumbnail.public_id
        },
        duration:videoFile.duration,
        isPublished:false,
        owner:req.user._id
    })

    console.log(video);
    
    const videoUploaded = await Video.findById(video._id)
    if(!videoUploaded){
        throw new ApiError(500, "videoUpload failed please try again !!!")
    }

    res
    .status(200)
    .json(new ApiResponse(200, video, "Video uploaded successfully"));
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const video = await Video.aggregate([
        {
            $match:{
                _id:mongoose.Types.ObjectId(videoId)
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
            $lookup:{
                from:"comments",
                localField:"_id",
                foreignField:"video",
                as:"comments"
            }
        },
        {
            $lookup:{
                from:"users",
                localField:"owner",
                foreignField:"_id",
                as:"owner",
                pipeline:[
                    {
                        $lookup:{
                            from:"subscriptions",
                            localField:"_id",
                            foreignField:"channel",
                            as:"subscribers"
                        }
                    },
                    {
                        $lookup: {
                            from: "subscriptions",
                            localField: "_id",
                            foreignField: "subscriber",
                            as: "subscribedTo"
                        }
                    },
                    {
                        $addFields: {
                            subscribersCount: {
                                $size: "$subscribers"
                            },
                            channelsSubscribedToCount: {
                                $size: "$subscribedTo"
                            },
                            isSubscribed: {
                                $cond: {
                                    if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                                    then: true,
                                    else: false
                                }
                            }
                        }
                    },
                    {
                           $project: {
                                username: 1,
                                "avatar.url": 1,
                                subscribersCount: 1,
                                isSubscribed: 1,
                                channelsSubscribedToCount:1
                            }
                    }
                ]
            }
        },
        {
            $addFields:{
                likeCount:{
                    $size: "$likes"
                },
                isliked:{
                    $cond: {
                        if:{$in:[req.user?._id,"$likes.likedBy"]},
                        then:true,
                        else:false
                    }
                }
            }
        },
        {
            $project: {
                "videoFile.url":1,
                thumbnail:1,
                title:1,
                description:1,
                duration:1,
                views:1,
                owner:1,
                comments:1,
                likeCount:1,
                isliked:1
            }
        }
    ])

    if(!video){
        return res.status(404).send({message: "Video not found"})
    }
     await Video.findByIdAndUpdate(videoId,{
        $inc: {views: 1}
     })

     await User.findByIdAndUpdate(req.user?._id,{
        $addToSet:{
            watchHistory: videoId
        }
     })
   return res
   .status(200)
   .json(new ApiResponse(200,video[0],"video details fetched successfully"))
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const {title,description} = req.body
    //TODO: update video details like title, description, thumbnail

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }
 

    if(!(description && title)){
       throw new ApiError(400,"title and description are required")
    }
     
    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError(404,"Video not found")
    }

    // Verify ownership: ensures `video.owner` (ObjectId) matches `req.user._id`, preventing unauthorized access.
    if (!req.user || !video.owner.equals(req.user._id)) {
        throw new ApiError(403, "You are not the owner of this video");
    }

    const thumbnailToDelete  = video.thumbnail.public_id
    const thumbnailToUpdate = req.file?.path

    if(!thumbnailToUpdate){
        throw new ApiError(400,"Thumbnail is required")
    }

    const thumbnail = await uploadOnCloudinary(thumbnailToUpdate)

    const updatedVideo = await Video.findByIdAndUpdate(videoId,
        {
            $set:{
                title:title,
                description:description,
                thumbnail:{
                    public_id:thumbnail.public_id,
                    url:thumbnail.url
                }
            }
        }
    )

   if(!updatedVideo){
    throw new ApiError(500,"Failed to update video")
   }

   if(updatedVideo){
    await deleteOnCloudinary(thumbnailToDelete)
   }

   return res
   .status(200)
   .json(new ApiResponse(200,updatedVideo,"Video updated successfully"))

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError(404,"Video not found")
    }

    // Verify ownership: ensures `video.owner` (ObjectId) matches `req.user._id`, preventing unauthorized access.
    if (!req.user || !video.owner.equals(req.user._id)) {
        throw new ApiError(403, "You are not the owner of this video");
    }

    const deleteVideo = await Video.findByIdAndDelete(video._id)

    if(!deleteVideo){
        throw new ApiError(500,"Failed to delete video please try again")
    }

    await deleteOnCloudinary(video.thumbnail.public_id)
    await deleteOnCloudinary(video.videoFile.public_id)

    await Like.deleteMany({ video: video._id })
    await Comment.deleteMany({ video: video._id })

    res
    .status(200)
    .json(new ApiResponse(200,deleteVideo,"Video deleted successfully"))
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError(404,"Video not found")
    }

    if (!req.user || !video.owner.equals(req.user._id)) {
        throw new ApiError(403, "You are not the owner of this video");
    }

    const toggledVideoPublish  = await Video.findByIdAndUpdate(videoId,{
        $set:{
            isPublished: !video.isPublished
        }
    },{new:true})

    if(!toggledVideoPublish){
        throw new ApiError(500,"Failed to toggle video publish status try again")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,toggledVideoPublish,"Video publish status toggled successfully")
    )
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}