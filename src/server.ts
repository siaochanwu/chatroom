import "dotenv/config";
import express from "express";
import http from "http";
import { Server, Socket } from "socket.io";
import mongoose from "mongoose";
import User from "./models/UserModel";
import Message from "./models/MessageModel";
import bodyParser from "body-parser";
import user from "./routes/user";
import jwt, { Secret } from "jsonwebtoken";

const { JWT_SECRET } = process.env;

const app = express();
app.use(bodyParser.json());
app.use("/user", user);

const server = http.createServer(app);
const io = new Server(server);

mongoose.connect("mongodb://localhost:27017/chatchat");


io.use((socket: Socket, next) => {

    const token = socket.handshake.headers.token as string;
    console.log(11111, token)
    if (!token) {
        return next(new Error("authentication error"));
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET as Secret) as any;
        socket.data.user = decoded;

        next();
    } catch (err) {
        return next(new Error("authentication error"));
    }

});

io.on("connection", (socket: Socket) => {
    console.log("a user connected", socket.data.user);

    

    socket.on("disconnect", () => {
        console.log("a user disconnected", socket.id);
    });
});

server.listen(3000, () => {
  console.log("server is running on port 3000");
});
