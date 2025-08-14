import mongoose,{Schema} from "mongoose";

const playlistSchema = new Schema(
    {
        name:{
            type:String,
            required:true
        },
        description:{
            type:String,
            required:true
        },
        videos:
        [    {type:Schema.Types.ObjectId,
            ref:"Video",
        },
    ],
    owner:{
        type:Schema.Types.ObjectId,
        ref:"User1",  // reference me hamesha model ka name hi dena hai

    },
    }
);

export const PlayList = mongoose.model("PlayList", playlistSchema);
