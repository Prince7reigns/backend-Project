import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

export async function connectDB(){
    try {
       const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
       //TODO: console.log(connectionInstance) check what mongoose.connect returning
       console.log(`\n MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`)
       
    } catch (error) {
        console.log("MONGODB connection FAILED ", error);
        process.exit(1)
    }
}