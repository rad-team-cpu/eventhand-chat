import { Db, ObjectId } from 'mongodb';
import { Message, MessageInput } from '@src/models/message';
import mongoDbClient from '@database/mongodb';

const mongoDatabase = mongoDbClient().db();

const createMessage = async (
    data: MessageInput,
    database: Db = mongoDatabase
) => {
    const { senderId, content, timestamp } = data;

    const collection = database.collection('messages');

    const document: Message = {
        _id: new ObjectId(),
        senderId,
        content,
        timestamp,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const result = await collection.insertOne(document);

    return result;
};

export { createMessage };
