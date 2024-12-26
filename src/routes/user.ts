import express, {Request, Response} from "express";
import prisma from '../lib/prisma.ts';
import bcrypt, { compare } from "bcrypt";
import pkge from "jsonwebtoken";
import { loginValidation, registrationValidation } from "../validators/auth.ts";
import { validationResult } from "express-validator";

const userRouter = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;
const TOKEN_NAME = process.env.TOKEN_NAME;
const { sign } = pkge;

if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined in environment variables");
}

if (!TOKEN_NAME) {
    throw new Error("TOKEN_NAME is not defined in environment variables");
}

//all user
userRouter.get("/users", async (req: Request, res: Response) => {
    try {
        const users = await prisma.user.findMany();
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json(error);
    }
})

//user by id
userRouter.get("/users/:id", async (req: Request, res: Response) => {
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
//registration
userRouter.post("/register", registrationValidation, async (req: Request, res: Response): Promise<void> => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }

    try {
        const {email, password, name, role} = req.body;
        const existingUser = await prisma.user.findUnique({
            where: {email}
        })
        if (existingUser) {
            res.status(400).json({ error: "User already exists" });
            return;
        }

        const hashedPassword = await bcrypt.hash(password,14);
        await prisma.user.create({
          data: {email, password: hashedPassword, name, role},
        });
        res.status(201).json({message: "User registered successfully."});
        return;
      } catch (error) {
        console.error(error);
        res.status(500).json(error);
      }
});

//login
userRouter.post("/login",loginValidation, async (req: Request, res: Response): Promise<void> => {
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({errors: errors.array()});
        return;
    }

    const {email, password} = req.body;
    try {
        const user = await prisma.user.findUnique({ where: {email} });
        if (!user) {
            res.status(400).json({error: "Invalid credentials"});
            return;
        }

        const isValidPassword = await compare(password, user.password);
        if (!isValidPassword) {
            res.status(400).json({ error: "Invalid credentials" });
            return;
        }
        const token = sign({id: user.id, name: user.name, email: user.email, role: user.role}, JWT_SECRET, {expiresIn: "1h"})
        res
        .status(200)
        .cookie(TOKEN_NAME, token, {httpOnly: true, secure: false, sameSite: "lax", maxAge: 60*60*1000})
        .json({ message: "Logged in successfully!" });
        return;
    } catch (error) {
        console.error(error);
        res.status(500).json(error);
    }
});

export default userRouter;