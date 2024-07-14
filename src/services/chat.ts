import { Db, Filter, ObjectId, UpdateFilter } from 'mongodb';
import mongoDbClient from '@database/mongodb';
import { Chat, ChatList } from '@src/models/chat';
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

const findClientChatListByClientId = async (
    data: GetChatListInput,
    database: Db = mongoDatabase
) => {
    const { senderId, pageNumber, pageSize } = data;

    const userId = senderId;

    const collection = database.collection('chats');

    const filter = { userId: userId };
    const skip = (pageNumber - 1) * pageSize;
    const limit = pageSize;

    const pipeline = [
        {
            $match: {
                'user.id': new ObjectId(userId),
            },
        },
        {
            $lookup: {
                from: 'messages',
                let: { messageIds: '$messages' },
                pipeline: [
                    { $match: { $expr: { $in: ['$_id', '$$messageIds'] } } },
                    { $sort: { timestamp: -1 } },
                    { $limit: 1 },
                ],
                as: 'latestMessage',
            },
        },
        {
            $unwind: {
                path: '$latestMessage',
                preserveNullAndEmptyArrays: true,
            },
        },
        {
            $lookup: {
                from: 'vendors',
                localField: 'vendor.id',
                foreignField: '_id',
                as: 'vendorDetails',
            },
        },
        {
            $unwind: '$vendorDetails',
        },
        {
            $project: {
                id: '$_id',
                message: {
                    content: '$latestMessage.content',
                    timestamp: '$latestMessage.timestamp',
                },
                vendor: {
                    id: '$vendorDetails._id',
                    name: '$vendorDetails.name',
                    logo: '$vendorDetails.logo',
                },
            },
        },
        {
            $sort: {
                'message.timestamp': -1,
            },
        },
        {
            $skip: skip,
        },
        {
            $limit: limit,
        },
    ];

    const documents = await collection.aggregate(pipeline).toArray();
    const totalDocuments = await collection.countDocuments(filter);
    const totalPages = Math.ceil(totalDocuments / pageSize);

    const result: ChatList = {
        documents,
        totalPages,
        currentPage: pageNumber,
        hasMore: pageNumber < totalPages,
    };

    return result;
};

const findVendorChatListByVendorId = async (
    data: GetChatListInput,
    database: Db = mongoDatabase
) => {
    const { senderId, pageNumber, pageSize } = data;

    const vendorId = senderId;

    const collection = database.collection('chats');

    const filter = { vendorId: vendorId };
    const skip = (pageNumber - 1) * pageSize;
    const limit = pageSize;

    const pipeline = [
        {
            $match: {
                'vendor.id': new ObjectId(vendorId),
            },
        },
        {
            $lookup: {
                from: 'messages',
                let: { messageIds: '$messages' },
                pipeline: [
                    { $match: { $expr: { $in: ['$_id', '$$messageIds'] } } },
                    { $sort: { timestamp: -1 } },
                    { $limit: 1 },
                ],
                as: 'latestMessage',
            },
        },
        {
            $unwind: {
                path: '$latestMessage',
                preserveNullAndEmptyArrays: true,
            },
        },
        {
            $lookup: {
                from: 'users',
                localField: 'user.id',
                foreignField: '_id',
                as: 'userDetails',
            },
        },
        {
            $unwind: '$userDetails',
        },
        {
            $project: {
                id: '$_id',
                message: {
                    content: '$latestMessage.content',
                    timestamp: '$latestMessage.timestamp',
                },
                user: {
                    id: '$userDetails._id',
                    name: {
                        $concat: [
                            '$userDetails.firstName',
                            ' ',
                            '$userDetails.lastName',
                        ],
                    },
                    profilePicture: '$userDetails.profilePicture',
                },
            },
        },
        {
            $sort: {
                'message.timestamp': -1,
            },
        },
        {
            $skip: skip,
        },
        {
            $limit: limit,
        },
    ];

    const documents = await collection.aggregate(pipeline).toArray();
    const totalDocuments = await collection.countDocuments(filter);
    const totalPages = Math.ceil(totalDocuments / pageSize);

    const result: ChatList = {
        documents,
        totalPages,
        currentPage: pageNumber,
        hasMore: pageNumber < totalPages,
    };

    return result;
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
    findClientChatListByClientId,
    findVendorChatListByVendorId,
    createChat,
    pushMessageToChat,
};
