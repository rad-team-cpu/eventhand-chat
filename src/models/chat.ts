import User from './user';
import { ObjectId, Document } from 'mongodb';

type Chat = {
    _id: ObjectId;
    user: User;
    vendor: User;
    messages: ObjectId[];
    createdAt: Date;
    updatedAt: Date;
};

type ChatList = {
    documents: Document[];
    totalPages: number;
    currentPage: number;
    hasMore: boolean;
};

type ChatListItem = {
    id: ObjectId;
    vendor: {
        id: ObjectId;
        name: string;
        logo: string;
    };
    latestMessage: {
        content: string;
        timestamp: Date;
    };
};

export { Chat, ChatList, ChatListItem };
