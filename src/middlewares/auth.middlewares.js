import jwt from "jsonwebtoken"
import { User1 } from "../models/user1.model.js"
import { ApiError } from "../utils/ApiError.js"
import { asyncHandler } from "../utils/asyncHandler.js"

export const verifyJWT = asyncHandler(async(req,__, next)=>
{
    const token = req.cookies.accessToken || req.header
    ("Authorization")?.replace("Bearer ", "")

    if(!token){
        throw new ApiError(401, "Unauthorized")
    }

    try {
      const decodedToken =  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

     const user = await User1.findById(decodedToken?._id).select("-password -refreshToken")

     if(!user){
        throw new ApiError(401,"Unauthorized")
     }
     
     req.user = user 

     next()
    } catch (error) {
        throw new ApiError(401,error?.message ||"Invalid access token");
    }
}) 
