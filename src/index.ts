import express, { Application } from "express";
import dotenv from "dotenv";
import userRoutes from "./routes/user.ts";

dotenv.config();

const app: Application = express();

if(!process.env.PORT) {
    throw new Error("PORT is not defines in environment variables");
}
const port: number = parseInt(process.env.PORT, 10);

app.use(express.json());

app.use("/auth", userRoutes);

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