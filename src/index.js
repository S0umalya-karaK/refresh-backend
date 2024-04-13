import dotenv from "dotenv"
import connectDB from "./db/index.js"

dotenv.config({
    path:'./env'
})

connectDB()
.then(() => {
    app.listen(process.env.PORT || 8000, () => {
        console.log(`server listening on ${process.env.PORT}`);
    })
})
.catch((err) => {
    console.log("mongodb connection failed!!!", err);
})

































// import mongoose from "mongoose";

// import {DB_NAME} from "./constants";
// import express from "express";
// const app =express()
// (async () => {
//     try{
//         mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
//         app.on("error",(error) => {
//             console.log("ERRR:", error)
//             throw error
//         })
//         app.listen(process.env.PORT, () => {
//             console.log(`app listening on port ${process.env.PORT}`)
//         })
//     }catch(error){
//         console.log("ERROR:", error)
//         throw err
//     }
// })()

