import express from "express";

const userRoutes = express.Router();

userRoutes.get("/users", (req, res) => {
    try {
        res.status(200).send("Users this side");
    } catch (error) {
        res.status(500).json(error);
    }
})

export default userRoutes;