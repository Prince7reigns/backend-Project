import { ApiResponse } from "../utils/ApiResponse"
import asyncHandler from "../utils/asyncHandler"


const healthcheck = asyncHandler( (req,res) =>{

    return res
    .status(200)
    .json(
        new ApiResponse(200,
            {message:"Server is running and everything is O.k"},
            "ok"
        )
    )
})

export {healthcheck}