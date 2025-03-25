import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {Video} from "../models/video.model.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

    if(!mongoose.Types.ObjectId(videoId)){
        throw new ApiError(400, 'Invalid videoId')
    }

    const video = await Video.findById(videoId)

    if(!mongoose.Types.ObjectId.isValid){
        throw new ApiError(404, 'Video not found')
    }

    const commentsAggregate = await Comment.aggregate([
        {
            $match:{
                video:mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup:{
                from:"users",
                localField:"user",
                foreignField:"_id",
                as:"owner"
            }
        },
        {
            $lookup:{
                from:"likes",
                localField:"_id",
                foreignField:"comment",
                as:"likes"
            }
        },
        {
            $addFeilds:{
                likeCount:{
                    $size:"$likes"
                },
                owner:{
                    $first:"$owner"
                },
                isLiked:{
                    $cond:{
                        if:{
                            $in:[req.user._id,"$likes.likedBy"],
                        },
                        then:true,
                        else:false
                    }
                }
            }
        },
        {
            $sort:{
                createdAt:-1
            }
        },
        {
            $project:{
                content:1,
                createdAt:1,
                likeCount:1,
                isLiked:1,
                owner:{
                    username: 1,
                    fullName: 1,
                    "avatar.url": 1
                }
            }
        }
    ]) 

    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10)
    };

    const comments = Comment.aggregatePaginate(commentsAggregate,options)

    return res 
    .status(200)
    .json(
        new ApiResponse(200,comments,"comments fetched successfully")
    )
})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const {videoId} = req.params;
    const {content} = req.body;

    if(!content){
        throw new ApiError(400,"content is required")
    }

    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError(404,"video not found")
    }

    const comment = await Comment.create({
        content,
        owner: req.user._id,
        video: video._id
    })

    if(!comment){
        throw new ApiError(500,"failed to create comment")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,comment,"comment added successfully"))
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment

    const {commentId} = req.params
    const {content} = req.body

    if(!content){
        throw new ApiError(400,"content is required")
    }

    const comment = await Comment.findById(commentId)

    if(!comment){
        throw new ApiError(404,"comment not found")
    }

    if (!req.user || !comment.owner.equals(req.user._id)) {
        throw new ApiError(403, "You are not the owner of this comment only owner can edit");
    }

    
   const updatedComment = await Comment.findByIdAndUpdate(
       comment._id,
      {
        $set:{
            content:content
        }
      },
      {
        new:true
      }
   )

   if(!updatedComment){
    throw new ApiError(500,"failed to update comment")
   }

   return res
   .status(200)
   .json(new ApiResponse(200,updatedComment,"comment updated successfully"))
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }