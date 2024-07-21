import "dotenv/config";
import express from "express";
import http from "http";
import { Server, Socket } from "socket.io";
import mongoose from "mongoose";
import User from "./models/UserModel";
import Message from "./models/MessageModel";
import Room from "./models/RoomModel";
import bodyParser from "body-parser";
import user from "./routes/user";
import jwt, { Secret } from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";

const { JWT_SECRET } = process.env;

const app = express();
app.use(bodyParser.json());
app.use("/user", user);
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
    },

});

mongoose.connect("mongodb://localhost:27017/chatchat");


io.use((socket: Socket, next) => {

    const token = socket.handshake.headers.token as string;

    if (!token) {
        return next(new Error("authentication error"));
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET as Secret) as any;
        socket.data.user = decoded;
        // console.log(11111, socket.data.user)

        next();
    } catch (err) {
        return next(new Error("authentication error"));
    }

});

io.on("connection", (socket: Socket) => {
    console.log("a user connected");

    socket.on("join_room", async (otherUserId: string) => {
        const userId = socket.data.user.id;

        //check if room already exists between the two users
        let room = await Room.findOne({
            members: {
                $all: [userId, otherUserId],
            },
        })

        if (!room) {
            room = new Room({
                roomId: uuidv4(),
                members: [userId, otherUserId],
            });

            await room.save();
        }

        console.log('room.roomId', room.roomId)

        socket.join(room.roomId);
        socket.emit("joined_room", room.roomId);

        //send chat history if any
        const messages = await Message.find({roomId: room.roomId}).populate('from');
        console.log('messages', messages)
        socket.emit("chat_history", messages);
    })

    socket.on("send_message", async (roomId: string, message: string) => {
        // console.log('roomId!!!!!', roomId)
        // console.log('message!!!!', message)
        const userId = socket.data.user.id;
    
        const newMessage = new Message({
            from: userId,
            message,
            roomId,
        });
    
        await newMessage.save();
    
        io.to(roomId).emit("new_message", newMessage);
    });

    socket.on("disconnect", () => {
        console.log("a user disconnected", socket.id);
    });
});

server.listen(3000, () => {
  console.log("server is running on port 3000");
});
