import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User1 } from "../models/user1.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { secureHeapUsed } from "crypto";
import { Jwt } from "jsonwebtoken";
const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User1.findById(userId);

    // small check for user existence
    const accessToken = user.generateAccess();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ valiidateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while  generating access and refresh token"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  try {
    const { fullName, email, username, password } = req.body;
  
    // validation
    if (
      //fullName?.trim()===""  instead of this we can use a trick jisse wo sab me apply hoga jaha empty hoga
      [fullName, username, email, password].some((field) => field?.trim() === "") // array ka istemal karke hua hai yewala
    ) {
      throw new ApiError(400, "All fields are required");
    }
  
    const existedUser = await User1.findOne({
      $or: [{ username }, { email }],
    });
  
    if (existedUser) {
      throw new ApiError(409, "User with email or username already exists");
    }
    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverLocalPath = req.files?.coverImage[0]?.path;
  
    if (!avatarLocalPath) {
      throw new ApiError(400, "Avatar file is missing");
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverLocalPath);
  
    if (!avatar) {
      throw new ApiError(500, "Failed to upload avatar");
    }
  
    if (!coverImage) {
      throw new ApiError(500, "Failed to upload cover image");
    }
    const user = await User1.create({
      fullName,
      avatar: avatar.url,
      coverImage: coverImage?.url || "",
      email,
      password,
      username: username.toLowerCase(),
    });
  
    const createdUser = await User1.findById(user._id).select(
      "-password -refreshToken "
    );
  
    if (!createdUser) {
      throw new ApiError(500, "Something went wrong while registering a user");
    }
  
    return res
      .status(201)
      .json(new ApiResponse(200, createdUser, "User registered successfully"));
  } catch (error) {
    console.log("Error while registring",error);
    return res.status(500).json({message: "Internal server error"});
  }
});
// login controller

const loginUser = asyncHandler(async (req, res) => {
  // get data from body

  const { email, username, password } = req.body;

  // validation
  if (!email) {
    throw new ApiError(400, "Email is required ");
  }

  const user = await User1.findOne({
    $or: [{ username }, { email }],
  });
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  // validate password

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid credentials");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  const loggedInUser = await User1.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true, // not modifiable by client side only we can modify
    secure: process.env.NODE_ENV === " production",
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        "User logged in successfully"
      )
    );
});

// logout means removing refresh token form user cookie 

const logoutUser = asyncHandler (async(req,res)=> {
 await User1.findByIdAndUpdate(
  //need to comeback here after middleware video
  req.user._id,
 {
  $set: { // used to set new field
    refreshToken: undefined,
  }
 },
 {new : true}
 )

const options = {
  httpOnly:true,
  secure : process.env.NODE_ENV === "production",
}

return res
.status(200)
.clearCookie("accessToken", options)
.clearCookie("refreshToken", options)
.json(new ApiResponse(200,{}, "User logged out succesfully"))

})

const refreshAccessToken = asyncHandler(async (req,res) =>
{
  // collect incoming refresh token
  const incomingRefreshToken = req.cookies.refreshToken ||
  req.body.refreshToken

  if(!incomingRefreshToken){
    throw new ApiError(401, "Refresh token is required")
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    )

   const user = await User1.findById(decodedToken?._id)

    if(!user){
      throw new ApiError(401,"Invalid refresh token")
    }

    if(incomingRefreshToken !== user?.refreshToken){
         throw new ApiError(401, "Invalid refresh token");
    }

    const options = {
      httpOnly : true,
      secure : process.env.NODE_ENV === "production"
    }
  const{accessToken , refreshToken: newRefreshToken} = 
  await generateAccessAndRefreshToken(user._id)
 
  return res
  .status(200)
  .cookie("accessToken", accessToken, options)
  .cookie("refreshToken", newRefreshToken,options)
  .json(
    new ApiResponse(
    200,
   {accessToken,
    refreshToken: newRefreshToken
   }, 
    "Access token refreshed successfully"
  ));

  } catch (error) {
    throw new ApiError(500, "Something went wrong while refreshing access token")
  }
})

const changeCurrentPassword = asyncHandler(async (req,res) =>{
   const {oldPassword , newPassword} = req.body
  const user = await User1.findById(req.user?._id)
  
  // validation of password 

  const isPasswordValid = await user.isPasswordCorrect(oldPassword)

  if(!isPasswordValid){
    throw new ApiError(401,"Old password is incorrect")
  }
  // updating password
  user.password = newPassword;
  await user.save({valiidateBeforeSave : false})

  return res.status(200).json(new ApiResponse(200,{},
    "password changed successfully" ))


})

const getCurrentUser = asyncHandler(async (req, res) => {
     return res.status(200).json(new ApiResponse(200,req.user,"current user details"))

});

const updateAccountDetails = asyncHandler(async (req, res) => {
      const {fullname,email} = req.body

      if(!fullname || !email){
        throw new ApiError(400, "Fullname and email are required")
      }
   const user = await User1.findByIdAndUpdate(
      req.user?._id,
      {
        $set:{
          fullname,
          email: email,
        }
      },
      {new : true}
    ).select("-password -refreshToken")
    
     return res.status(200).json(new ApiResponse(200,user, "Account details updated successfully"));


});

const updateUserAvatar = asyncHandler(async (req, res) => {
   const avatarLocalPath =  req.file?.path

   if(!avatarLocalPath){
    throw new ApiError(400,"File is required")
   }

   const avatar = await uploadOnCloudinary(avatarLocalPath)

   if(!avatar.url){
    throw new ApiError(500,"Something went wrong while uploading avatar")
   }

  const user = await User1.findByIdAndUpdate(
    req.user?._id,
    {
      $set:{
        avatar: avatar.url
      }
    },
    {new:true}
   ).select("-password -refreshToken")

   res.status(200).json(new ApiResponse(200, user ," Avatar updated successfully"))
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path

    if(!coverImageLocalPath){
      throw new ApiError(400,"File is required")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    if(!coverImage.url){
      throw new ApiError(500,"Something went wrong while uploading cover image")
    }
    
    const user = await User1.findByIdAndUpdate(
      req.user?._id,
      {
        $set: {
          coverImage : coverImage.url
        }
      },
      {new: true}
    ).select("-password -refreshToken")

    return res.status(200).json(new ApiResponse(200,user, "cover image updated successfully"))
});

export { 
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage

 };
