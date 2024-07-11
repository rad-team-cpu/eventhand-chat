import { ObjectId } from 'mongodb';

type Message = {
    _id: ObjectId;
    senderId: string;
    content: string;
    timestamp: Date;
    createdAt?: Date;
    updatedAt?: Date;
};

export default Message;
