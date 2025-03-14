import dotenv from "dotenv"
import { connectDB } from "./db/index.js"
import { app } from "./app.js"

dotenv.config({
    path:"./env"
})

connectDB()
.then(()=>{
    app.listen(process.env.PORT || 8000 ,()=>{
        console.log(`Server is running on port :${process.env.PORT}`)
    })
    app.on("error",()=>{
        console.log("Error Occured while listen about port")
    })
})
.catch((err) =>{
    console.log("MONGODB connetion failed",err)
})