import { Router } from "express";
import {upload}  from "../middlewares/multer.middlewares.js"
import { verifyJWT } from "../middlewares/auth.middlewares.js"
import { getAllVideos, publishAVideo } from "../controllers/video.controller.js";

const router = Router()



router.route("/publish-video")
.get(verifyJWT,getAllVideos)
.post(verifyJWT , upload.fields(
    [{
        name:"videoFile",
        maxCount:1
    },{
        name:"thumbnail",
        maxCount:1
    }]
  ),
  publishAVideo
)


export default router