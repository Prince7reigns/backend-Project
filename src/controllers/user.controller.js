import asyncHandler from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import { User } from "../models/user.model.js";
import {uploadOnCloudinary} from '../utils/cloudinary.js'
import { ApiResponse } from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"

const generateAccessAndRefereshTokens = async (userId) =>{
    try {
    const user = await User.findById(userId);

    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();
     
    user.refreshToken = refreshToken

    user.save({validateBeforeSave:false})

    return {accessToken,refreshToken}
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating referesh and access token")
    }
}

const registerUser = asyncHandler(async (req,res)=>{
     // get user details from frontend
    // validation - not empty
    // check if user already exists: username, email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return res   

    const {fullName,email,password,username}=req.body
     console.log(`fullname: ${fullName}, email: ${email}, password: ${password}, username: ${username}`);
    
    if(
        [fullName,email,password,username].some((feilds => feilds?.trim()===""))
    ){
        throw new ApiError(400,"all feilds are required")
    }

    const existedUser = await User.findOne({
        $or:[{ username },{ email }]
    });
   
    

    if(existedUser){
        throw new ApiError(409,"username or email already exists")
    }
    
     
    const avatarLocalPath = req.files?.avatar[0]?.path
    //const coverImageLocalPath = req.files?.coverImage[0]?.path;


    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) &&  req.files.coverImage.length > 0){
        coverImageLocalPath = req.files.coverImage[0].path
    }
    
    

    if(!avatarLocalPath){
        throw new ApiError(400,"avatar is required")
    }
 
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
   console.log(coverImage);
   
    if(!avatar){
        throw new ApiError(500,"avatar upload failed")
    }

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email, 
        password,
        username: username.toLowerCase()
    })

   const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
   )

   if(!createdUser){
     throw new ApiError(500, "Something went wrong while registering the user")
   }

   return res.status(201).json(
    new ApiResponse(200, createdUser, "User registered Successfully")
     )

})

const loginUser = asyncHandler( async (req,res) =>{
    // req body -> data
    // username or email
    //find the user
    //password check
    //access and referesh token
    //send cookie

    const {email,password,username} = req.body
    console.log(email ," " ,password,"  " , username);
    
    if(!email && !username){
        throw new ApiError(400,"Email or username are required")
    }

    const user = await User.findOne({
        $or: [{ email }, { username }]
    })
    
    if(!user){
        throw new ApiError(404, "User does not exist")
    }

    const isPasswordValid = await user?.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(401, "Invalid password")
    }

    const {accessToken,refreshToken} = await generateAccessAndRefereshTokens(user._id)

    const loggedInUser = await User.findById(user._id)
    .select("-password -refreshToken")
    
    const options = {
        httpOnly: true,
        secure:true
        // by defualt any one can change cooke from fronted when use true the httponly and secure then its only changeable from server
    }

    return res.status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged in successfully"
        )
    )
})

const logoutUser = asyncHandler(async (req,res) =>{
      await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken:undefined
            }
        },
        {
            new:true
        }
      )

      const options = {
        httpOnly: true,
        secure:true
        // by defualt any one can change cooke from fronted when use true the httponly and secure then its only changeable from server
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"))
})

const refreshAccessToken = asyncHandler(async(req,res)=>{
    const incomingRefreshToken = req.cookie.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new ApiError(401, "unauthorized request")
    }

    try {
       const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )

        const user = await User.findById(decodedToken._id)

        if (!user) {
            throw new ApiError(401, "Invalid refresh token")
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used")
            
        }

        const  {accessToken, newRefreshToken} =  generateAccessAndRefereshTokens(user._id)
        const options = {
            httpOnly: true,
            secure:true
        }

        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200, 
                {accessToken, refreshToken: newRefreshToken},
                "Access token refreshed"
            )
        )

    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }
    
})

const changeCurrentPassword = asyncHandler(async (req,res)=>{
    const {oldPassword, newPassword} = req.body

    if(!(oldPassword && newPassword)){
        throw new ApiError(400, "Old and new password are required")
    }

    const user= await User.findById(req.user._id)

    const isPasswordCurrect = await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCurrect){
        throw new ApiError(400, "Old password is incorrect")
    }

    user.password=newPassword
    await user.save({validateBeforeSave:false})

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed"))
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken
  }