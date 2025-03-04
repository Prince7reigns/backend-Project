import asyncHandler from "../utils/asyncHandler.js"
import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js";

export const varifyJWT = asyncHandler(async (req,res,next)=>{
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","")
        
    //    console.log(token);
    if (!token) {
        throw new ApiError(401, "Unauthorized request")
    }



})