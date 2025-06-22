import app from "./app"
import mongoose from "mongoose";
import env from "./utils/validateEnv"
import * as admin from 'firebase-admin';

const port = env.PORT;

mongoose.connect(env.MONGO_CONNECTION_STRING)
.then(() => {
    console.log("Mongoose connected")
    app.listen(port, () => {
        console.log("Server is running");
    })
})
.catch(console.error)

