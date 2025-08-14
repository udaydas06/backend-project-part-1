import mongoose from "mongoose";
import { DB_NAME} from "../constants.js";

const connectDB = async () => {
    try {
        console.log(process.env.PORT);
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`,{
            useNewUrlParser: true,
            useUnifiedTopology: true
        })
        console.log(`\n MongoDB connected! DB host :${connectionInstance.connection.host}`);
    } catch (error) {
        console.log("MongoDB Connection error", error)
        process.exit(1);
    }
}

export default connectDB

