import {Schema, model, Document} from 'mongoose';


interface IRoom extends Document {
    roomId: string;
    members: Schema.Types.ObjectId[];
    messages: Schema.Types.ObjectId[];
    createdAt: Date;
}

const roomSchema = new Schema<IRoom>({
    roomId: {type: String, required: true, unique: true},
    members: [
        {
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
    ],
    messages: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Message',
        },
    ],
    createdAt: {type: Date, default: Date.now},
});

const Room = model<IRoom>('Room', roomSchema);
export default Room;