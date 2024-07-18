import {Schema, model, Document} from 'mongoose';

interface IUser extends Document {
    username: string;
    password: string;
    email: string;
    avatar: string;
    status: 'online' | 'offline';
    createdAt: Date;
    chatRecord?: Schema.Types.ObjectId[];
    resetPasswordToken?: string;
    resetPasswordExpires?: Date;
}

const userSchema = new Schema<IUser>({
    username: {type: String, required: true, unique: true},
    password: {type: String, required: true},
    email: {type: String, required: true, unique: true},
    avatar: {type: String, default: 'https://www.gravatar.com/avatar/?d=identicon'},
    status: {type: String, enum: ['online', 'offline'], default: 'offline'},
    chatRecord: [
        {
            roomId: {
                type: Schema.Types.ObjectId,
                ref: 'Room',
            },
            receiver: {
                type: Schema.Types.ObjectId,
                ref: 'User',
            },
        },
    ],
    createdAt: {type: Date, default: Date.now},
    resetPasswordToken: {type: String},
    resetPasswordExpires: {type: Date},
});

const User = model<IUser>('User', userSchema);
export default User;