 import mongoose,{Schema} from "mongoose"

 const commentSchema = new Schema({
    content: {
        type: String,
        required: true
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
    video:{
        type: Schema.Types.ObjectId,
        ref: 'Video',
    }
 },{
    timestamps:true
 })


export const Comment = mongoose.model("comment" , commentSchema)