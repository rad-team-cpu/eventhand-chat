import { Db, Filter, FindOptions, ObjectId, UpdateFilter } from 'mongodb';
import mongoDbClient from '@database/mongodb';
import Chat from '@src/models/chat';
import { createMessage } from './message';
import { GetChatListInput, MessageInput } from '@src/models/socketInputs';

const mongoDatabase = mongoDbClient().db();

const findChatById = async (
    data: MessageInput,
    database: Db = mongoDatabase
) => {
    const { chatId } = data;

    const collection = database.collection<Chat>('chats');

    const filter: Filter<Chat> = { _id: new ObjectId(chatId) };

    const chat = await collection.findOne<Chat>(filter);

    return chat;
};

const findChatByUsers = async (
    data: MessageInput,
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

const findChatListsById = async (
    data: GetChatListInput,
    database: Db = mongoDatabase
) => {
    const { senderId, senderType, pageNumber, pageSize } = data;

    const id =
        senderType === 'CLIENT' ? { userId: senderId } : { vendorId: senderId };

    const collection = database.collection('chats');

    const skip = (pageNumber - 1) * pageSize;
    const limit = pageSize;

    const filter = { ...id };
    const options: FindOptions = {
        skip: skip,
        limit: limit,
        sort: { updatedAt: -1 },
    };

    const totalDocuments = await collection.countDocuments(filter);
    const documents = await collection.find(filter, options).toArray();
    const totalPages = Math.ceil(totalDocuments / pageSize);

    return {
        documents,
        totalPages,
        currentPage: pageNumber,
        hasMore: pageNumber < totalPages,
    };
};

const createChat = async (data: MessageInput, database: Db = mongoDatabase) => {
    const message = await createMessage(data);
    const messageId = message.insertedId;

    const { senderId, senderName, receiverId, receiverName, senderType } = data;

    const collection = database.collection<Chat>('chats');

    const user =
        senderType == 'CLIENT'
            ? { _id: new ObjectId(senderId), name: senderName }
            : { _id: new ObjectId(receiverId), name: receiverName };
    const vendor =
        senderType == 'VENDOR'
            ? { _id: new ObjectId(senderId), name: senderName }
            : { _id: new ObjectId(receiverId), name: receiverName };

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
    data: MessageInput,
    database: Db = mongoDatabase
) => {
    const { chatId } = data;

    const message = await createMessage(data);
    const messageId = message.insertedId;

    const collection = database.collection<Chat>('chats');

    const filter: Filter<Chat> = { _id: new ObjectId(chatId) };

    const updatefilter: UpdateFilter<Chat> = {
        messages: { $push: messageId },
        updatedAt: new Date(),
    };

    const result = await collection.updateOne(filter, updatefilter);

    return result;
};

export {
    findChatById,
    findChatByUsers,
    findChatListsById,
    createChat,
    pushMessageToChat,
};
