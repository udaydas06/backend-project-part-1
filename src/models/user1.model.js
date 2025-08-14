import mongoose ,{Schema}from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new Schema(
    {
  username: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  fullName: {
    type: String,
    required: true,
    trim: true,
    index:true,
  },
  avatar:{
    type: String,// cloudinary URL
    required: true,
  },
  coverImage:{
    type: String,
  },

  watchHistory:[
    {
        type: Schema.Types.ObjectId,
        ref:"Video"
    }
  ],
  password:{
    type: String,
    required: [true,"Password is required"] // custom message passed in array
  },
  refreshToken:{
    type: String,
  }
  

},
{ timestamps:true}// another object createdAt & updatedAt by default de deta hai

)

// encrypting password using bcrypt keyword

 userSchema.pre("save", async function (next) {
  if(!this.isModified("password")) return next()

      this.password = await bcrypt.hash(this.password, 10);

  next()
 })

 userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password,this.password)
 }

 userSchema.methods.generateAccessToken = function () {
  // short lived access token
return  jwt.sign(
    {
      _id: this._id, // unique way to find user in database
      email: this.email,
      username: this.username,
      fullname: this.fullname,
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
  );
 }

 
 userSchema.methods.generateRefreshToken = function () {
   // short lived access token
   return jwt.sign(
     {
       _id: this._id,
     },
     process.env.REFRESH_TOKEN_SECRET,
     { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
   );
 };




export const User1 = new mongoose.model("User1", userSchema) // name and basis of schema

// image ke liye ki cloudinary se direct url ko refrence de dete hai

// enum:[] iska matlab choices hota hai
/*
status:{
type: string,
enum: ["PENDING","CANCELED","DELIVERED"], 
default: "PENDING"
}
*/