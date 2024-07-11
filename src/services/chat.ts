import { Db, Filter, ObjectId, UpdateFilter } from 'mongodb';
import mongoDbClient from '@database/mongodb';
import Chat from '@src/models/chat';
import { createMessage } from './message';
import { SocketInput } from '@src/models/socketInput';

const mongoDatabase = mongoDbClient().db();

const findChatById = async (
    data: SocketInput,
    database: Db = mongoDatabase
) => {
    const { chatId } = data;

    const collection = database.collection<Chat>('chats');

    const filter: Filter<Chat> = { _id: new ObjectId(chatId) };

    const chat = await collection.findOne<Chat>(filter);

    return chat;
};

const findChatByUsers = async (
    data: SocketInput,
    database: Db = mongoDatabase
) => {
    const { senderId, receiverId, senderType } = data;

    const collection = database.collection<Chat>('chats');

    const userId = senderType == 'CLIENT' ? senderId : receiverId;

    const vendorId = senderType == 'VENDOR' ? senderId : receiverId;

    const filter: Filter<Chat> = {
        user: { _id: userId },
        vendor: { _id: vendorId },
    };

    const chat = await collection.findOne<Chat>(filter);

    return chat;
};

const createChat = async (data: SocketInput, database: Db = mongoDatabase) => {
    const message = await createMessage(data);
    const messageId = message.insertedId;

    const { senderId, senderName, receiverId, receiverName, senderType } = data;

    const collection = database.collection<Chat>('chats');

    const user =
        senderType == 'CLIENT'
            ? { _id: senderId, name: senderName }
            : { _id: receiverId, name: receiverName };
    const vendor =
        senderType == 'VENDOR'
            ? { _id: senderId, name: senderName }
            : { _id: receiverId, name: receiverName };

    const document: Chat = {
        _id: new ObjectId(),
        user,
        vendor,
        messages: [messageId],
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const result = await collection.insertOne(document);

    return result;
};

const pushMessageToChat = async (
    data: SocketInput,
    database: Db = mongoDatabase
) => {
    const { chatId } = data;

    const message = await createMessage(data);
    const messageId = message.insertedId;

    const collection = database.collection<Chat>('chats');

    const filter: Filter<Chat> = { _id: new ObjectId(chatId) };

    const updatefilter: UpdateFilter<Chat> = { messages: { $push: messageId } };

    const result = await collection.updateOne(filter, updatefilter);

    return result;
};

export { findChatById, findChatByUsers, createChat, pushMessageToChat };
