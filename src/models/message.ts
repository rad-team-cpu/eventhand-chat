import { ObjectId, WithId } from 'mongodb';

type Message = {
    _id: ObjectId;
    senderId: string;
    content: string;
    timestamp: Date;
    createdAt?: Date;
    updatedAt?: Date;
};

type MessageList = {
    documents: Document[] | WithId<Message>[];
    totalPages: number;
    currentPage: number;
    hasMore: boolean;
};

export { Message, MessageList };
