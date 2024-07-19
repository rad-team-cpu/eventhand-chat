import { Db, Filter, FindOptions, ObjectId } from 'mongodb';
import { Message, MessageList } from '@src/models/message';
import mongoDbClient from '@database/mongodb';
import { GetMessagesInput, MessageInput } from '@src/models/socketInputs';
import { Chat } from '@src/models/chat';

const mongoDatabase = mongoDbClient().db();

// const findMessagesByChatId = async (
//     data: GetMessagesInput,
//     database: Db = mongoDatabase
// ) => {
//     const { chatId, pageNumber, pageSize } = data;

//     const chatCollection = database.collection<Chat>('chats');

//     const skip = (pageNumber - 1) * pageSize;
//     const limit = pageSize;

//     const chatFilter: Filter<Chat> = { _id: new ObjectId(chatId) };
//     const projection = { _id: 0, messages: 1 };

//     const chatDocument = await chatCollection.findOne(chatFilter, {
//         projection,
//     });

//     if (!chatDocument) {
//         throw new Error('Chat not found');
//     }

//     const { messages } = chatDocument;

//     const messageCollection = database.collection<Message>('messages');

//     const messagesFilter: Filter<Message> = { _id: { $in: messages } };

//     const options: FindOptions = {
//         skip: skip,
//         limit: limit,
//         sort: { createdAt: -1 },
//     };

//     const documents = await messageCollection
//         .find(messagesFilter, options)
//         .toArray();
//     const totalDocuments =
//         await messageCollection.countDocuments(messagesFilter);
//     const totalPages = Math.ceil(totalDocuments / pageSize);

//     const result: MessageList = {
//         documents,
//         totalPages,
//         currentPage: pageNumber,
//         hasMore: pageNumber < totalPages,
//     };

//     return result;
// };

const findMessagesByUsers = async (
    data: GetMessagesInput,
    database: Db = mongoDatabase
) => {
    const { senderId, receiverId, senderType, pageNumber, pageSize } = data;

    const chatCollection = database.collection<Chat>('chats');

    const userId = senderType == 'CLIENT' ? senderId : receiverId;

    const vendorId = senderType == 'VENDOR' ? senderId : receiverId;

    const chatFilter: Filter<Chat> = {
        user: new ObjectId(userId),
        vendor: new ObjectId(vendorId),
    };
    const projection = { _id: 0, messages: 1 };

    const chatDocument = await chatCollection.findOne<Chat>(chatFilter, {
        projection,
    });

    if (!chatDocument || chatDocument == null) {
        const result: MessageList = {
            documents: [],
            totalPages: 0,
            currentPage: pageNumber,
            hasMore: false,
        };

        return result;
    }

    const { messages } = chatDocument;

    const skip = (pageNumber - 1) * pageSize;
    const limit = pageSize;

    const messageCollection = database.collection<Message>('messages');

    const messagesFilter: Filter<Message> = { _id: { $in: messages } };

    const options: FindOptions = {
        skip: skip,
        limit: limit,
        sort: { createdAt: -1 },
    };

    const documents = await messageCollection
        .find(messagesFilter, options)
        .toArray();
    const totalDocuments =
        await messageCollection.countDocuments(messagesFilter);
    const totalPages = Math.ceil(totalDocuments / pageSize);

    const result: MessageList = {
        documents,
        totalPages,
        currentPage: pageNumber,
        hasMore: pageNumber < totalPages,
    };

    return result;
};

const createMessage = async (
    data: MessageInput,
    database: Db = mongoDatabase
) => {
    const { senderId, content, timestamp, isImage } = data;

    console.log(data);

    const collection = database.collection('messages');

    const document: Message = {
        _id: new ObjectId(),
        senderId,
        content,
        timestamp,
        isImage,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const result = await collection.insertOne(document);

    return result;
};

export { createMessage, findMessagesByUsers };
