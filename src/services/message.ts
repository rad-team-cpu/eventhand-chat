import { Db, ObjectId } from 'mongodb';
import Message from '@src/models/message';
import mongoDbClient from '@database/mongodb';
import { SocketInput } from '@src/models/socketInput';

const mongoDatabase = mongoDbClient().db();

const createMessage = async (
    data: SocketInput,
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
