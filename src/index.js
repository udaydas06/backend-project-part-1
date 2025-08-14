import dotenv from "dotenv";
import { app } from "./app.js";
import connectDB from "./db/index.js";
// path lena jaruri hai
dotenv.config();

// const router = express.Router();

const PORT = process.env.PORT || 8001;

connectDB()
.then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
})
.catch((err) => {
  console.log("MongoDB connection error", err);
  
})