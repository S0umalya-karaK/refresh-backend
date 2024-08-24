import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import { User} from "../models/user.model.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
// import {uploadOnCloudinary} from "../utils/cloudinary.js"
// import { ApiResponse } from "../utils/ApiResponse.js";
// import jwt from "jsonwebtoken"
// import mongoose from "mongoose";

const generateAccessAndRefereshTokens = async(userId) =>{
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return {accessToken, refreshToken}


    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating referesh and access token")
    }
}

const registerUser = asyncHandler(async (req,res) => {
    // get user details from user
    // validation-not empty
    // check if user already exist: username,email
    // check for images,check for avatar
    // create user object-create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return res

    const {fullName, email, username, password} = req.body;
    console.log("email:",email);

    if([fullName, email, username, password].some((field) => field?.trim() === "")){
        throw ApiError(400,"All fields are required")
    }
    
    const existedUser= User.findOne({
        $or: [ {username}, {email}]
    })

    if(existedUser){
        throw new ApiError(409,"Email or Username already exists")
    }

    const avatarLocalpath = req.files?.avatar[0]?.path

    let coverImageLocalPath
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage[0].length > 0){
        coverImageLocalPath = req.files.coverImage[0].path
    }

    if(!avatarLocalpath){
        throw new ApiError(400,"avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalpath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(400,"avatar file is required")
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

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
    )




})

const loginUser = asyncHandler(async (req,res) => {
    const {email,username,password} = req.body

    if(!(username || !email)){
        throw new ApiError(404,"username or email is required")
    }

    const user = await User.findOne({
        $or:[{username},{email}]
    })

    if(!user){
        throw new ApiError(404,"user doesn't exist")
    }

    const isPasswordCorrectvalid = await user.isPasswordCorrect(password)
    
    if(!isPasswordCorrectvalid){
        throw new ApiError(401,"Invalid user credentials")
    }

    const {accessToken,refreshToken} = await generateAccessAndRefereshTokens(user._id)
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
    const options = {
        httpOnly:true,
        secure:true
    }

    return res
           .status(200)
           .cookie("refreshToken",refreshToken,options)
           .cookie("accessToken",accessToken,options)
           .json(
             new ApiResponse(
                200,
                {
                  user:loggedInUser,accessToken,refreshToken
                },
                "user logged in successfully"
             )
           )
})

const logoutUser = asyncHandler(async(req,res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken: undefined
            },
        },
        {
            new:true
        }
    )
    const options = {
        httpOnly:true,
        secure:true
    }

    return res
           .status(200)
           .ClearCookie("accessToken", options)
           .ClearCookie("refreshToken", options)
           .json(new ApiResponse(200,{},"user logged out"))

})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id)
    
        if (!user) {
            throw new ApiError(401, "Invalid refresh token")
        }
    
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used")
            
        }

    const options = {
    httpOnly: true,
    secure: true
    }

    const {accessToken, newRefreshToken} = await generateAccessAndRefereshTokens(user._id)

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
    }
    catch (error) 
    {
    throw new ApiError(401, error?.message || "Invalid refresh token")
    }

})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken 
}