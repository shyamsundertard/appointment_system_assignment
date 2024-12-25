import express from "express";
import prisma from '../lib/prisma.ts';

const userRoutes = express.Router();

//all user
userRoutes.get("/users", async (req, res) => {
    try {
        const users = await prisma.user.findMany();
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json(error);
    }
})

//user by id
userRoutes.get("/users/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const users = await prisma.user.findUnique({
            where: {id}
        });
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json(error);
    }
})
//new user
userRoutes.post("/users", async (req, res) => {
    try {
        const {email, password, name, role} = req.body;
        const newUser = await prisma.user.create({
          data: {email, password, name, role},
        });
        res.status(200).json(newUser);
      } catch (error) {
        res.status(500).json(error);
      }
})

export default userRoutes;