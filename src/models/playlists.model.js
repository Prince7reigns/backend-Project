import mongoose , {Schema} from "mongoose";

const playlistsSchema = new Schema({
    name:{
        type:String,
        required:true
    },
    description:{
        type:String
    },
    user:{
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
    video:{
        type: Schema.Types.ObjectId,
        ref: 'Video',
    }
})

const playlists = mongoose.model("playlist",playlistsSchema)