import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";


const videoSchema = new Schema({
    videoFile:{
        type: String,
        required: [true, "videoFile is required"],
    },
    thumbnail:{
        type: String,
        required: [true, "thumbnail is required"],
    },
    title:{
        type: String,
        required: [true, "title is required"],
    },
    description:{
        type: String,
        required: [true, "Description is required"],
    },
    duration:{
        type: Number,
    },
    videoFile:{
        type: Number,
        default:0
    },
    owner:{
        type: Schema.Types.ObjectId,
        ref: "User",
    }
    },
    {
      timestamps: true
    }
)

videoSchema.plugin(mongooseAggregatePaginate)


export const Video = mongoose.model("Video" , videoSchema)