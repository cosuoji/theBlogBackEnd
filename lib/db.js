import mongoose from "mongoose";

 export const connectDB = async() => {
 
    try {
       const {MONGODB_URI} = process.env
        if(MONGODB_URI){
             const conn = await mongoose.connect(MONGODB_URI)
             console.log(`MongoDB connected: ${conn.connection.host}`)
         }
    
    } catch (error) {
        console.log(error.message)
        process.exit(1)
    }
}