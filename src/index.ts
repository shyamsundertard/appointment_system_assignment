import express, { Application } from "express";
import * as dotenv from "dotenv";
import userRouter from "./routes/user.js";
import availabilityRouter from "./routes/availability.js";
import cookieParser from "cookie-parser";
import appointmentRouter from "./routes/appointment.js";
import mongoose from "mongoose";


dotenv.config();

const app: Application = express();

if (!process.env.PORT || !process.env.DATABASE_URL) {
    throw new Error("PORT and DATABASE_URL are not defined in environment variables");
}

const port: number = parseInt(process.env.PORT, 10) || 3000;

app.use(express.json());
app.use(cookieParser());

mongoose.connect(process.env.DATABASE_URL as string, {
    tls: true,
    tlsAllowInvalidCertificates: true,
})
.then(() => {
    console.log("Connected to DocumentDB Database");
})
.catch(err => {
    console.error("Database connection error:", err);
    process.exit(1);  // Gracefully exit if database connection fails
});

  
// Routes
app.use("/auth", userRouter);
app.use("/", availabilityRouter);
app.use("/", appointmentRouter);


// returns 404 for other routes
app.use((req,res) => {
    res.status(404).send();
});

app.listen(port, (error?: Error) => {
    if (!error) {
        console.log('Server is Successfully running and App is listening on port: ' + port);
    }
    else
        console.log('Error occured, server cannot start', error);
});