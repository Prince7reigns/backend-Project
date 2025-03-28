import { Router } from "express";
import {upload}  from "../middlewares/multer.middlewares.js"
import { verifyJWT } from "../middlewares/auth.middlewares.js"
import { 
    deleteVideo,
    getAllVideos,
    getVideoById,
    publishAVideo,
    togglePublishStatus,
    updateVideo,
} from "../controllers/video.controller.js";

const router = Router()

router.use(verifyJWT);

router.route("/")
.get(getAllVideos)
.post(upload.fields(
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

router
    .route("/:videoId")
    .get(verifyJWT,getVideoById)
    .delete(verifyJWT,deleteVideo)
    .patch(verifyJWT , upload.single("thumbnail"), updateVideo);

    router.route("/toggle/publish/:videoId").patch(togglePublishStatus);


export default router