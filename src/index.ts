import express, { Application } from "express";
import dotenv from "dotenv";
import userRouter from "./routes/user.js";
import availabilityRouter from "./routes/availability.js";
import cookieParser from "cookie-parser";
import appointmentRouter from "./routes/appointment.js";

dotenv.config();

const app: Application = express();

if(!process.env.PORT) {
    throw new Error("PORT is not defines in environment variables");
}
const port: number = parseInt(process.env.PORT, 10) || 3000;

app.use(express.json());
app.use(cookieParser());

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