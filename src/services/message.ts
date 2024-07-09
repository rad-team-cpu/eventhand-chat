import { Db, ObjectId } from 'mongodb';
import { Message, MessageInput } from '@src/models/message';
import mongoDbClient from '@database/mongodb';

const mongoDatabase = mongoDbClient().db();

const createMessage = async (
    data: MessageInput,
    database: Db = mongoDatabase
) => {
    try {
        const collection = database.collection('messages');

        const document: Message = {
            _id: new ObjectId(),
            ...data,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        await collection.insertOne(document);
    } catch (error) {
        console.error(error);
    }
};

export { createMessage };
