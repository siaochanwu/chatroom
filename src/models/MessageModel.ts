import  {Schema, model, Document} from 'mongoose';


interface IMessage extends Document {
    from: string;
    to: string;
    message: string;
    read: boolean;
    roomId: string;
    timestamp: Date;
}

const messageSchema = new Schema<IMessage>({
    from: {type: String, required: true},
    to: {type: String, required: true},
    message: {type: String, required: true},
    read: {type: Boolean, required: true, default: false},
    roomId: {type: String, required: true},
    timestamp: {type: Date, default: Date.now},
});

const Message = model<IMessage>('Message', messageSchema);
export default Message;