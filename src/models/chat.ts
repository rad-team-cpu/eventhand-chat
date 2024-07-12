import User from './user';
import { ObjectId } from 'mongodb';

type Chat = {
    _id: ObjectId;
    user: User;
    vendor: User;
    messages: ObjectId[];
    createdAt: Date;
    updatedAt: Date;
};

export default Chat;
