import {
    Db,
    Filter,
    InsertOneResult,
    ObjectId,
    UpdateFilter,
    UpdateResult,
} from 'mongodb';
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
        user: new ObjectId(userId),
        vendor: new ObjectId(vendorId),
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

    const filter = { user: new ObjectId(userId) };
    const skip = (pageNumber - 1) * pageSize;
    const limit = pageSize;

    const pipeline = [
        {
            $match: {
                user: new ObjectId(userId),
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
                localField: 'vendor',
                foreignField: '_id',
                as: 'vendorDetails',
            },
        },
        {
            $unwind: {
                path: '$vendorDetails',
                preserveNullAndEmptyArrays: true,
            },
        },
        {
            $project: {
                id: '$_id',
                latestMessage: '$latestMessage.content',
                isImage: '$latestMessage.isImage',
                timestamp: '$latestMessage.timestamp',
                senderId: '$vendorDetails._id',
                senderName: '$vendorDetails.name',
                senderImage: '$vendorDetails.logo',
            },
        },
        {
            $sort: {
                timestamp: -1,
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

    const filter = { vendor: new ObjectId(vendorId) };
    const skip = (pageNumber - 1) * pageSize;
    const limit = pageSize;

    const pipeline = [
        {
            $match: {
                vendor: new ObjectId(vendorId),
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
                localField: 'user',
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
                latestMessage: '$latestMessage.content',
                timestamp: '$latestMessage.timestamp',
                isImage: '$latestMessage.isImage',
                senderId: '$userDetails._id',
                senderName: {
                    $concat: [
                        '$userDetails.firstName',
                        ' ',
                        '$userDetails.lastName',
                    ],
                },
                senderImage: '$userDetails.profilePicture',
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

const createChat = async (
    messageId: ObjectId,
    data: MessageInput,
    database: Db = mongoDatabase
) => {
    const { senderId, receiverId, senderType } = data;

    const collection = database.collection<Chat>('chats');

    const user =
        senderType == 'CLIENT'
            ? new ObjectId(senderId)
            : new ObjectId(receiverId);
    const vendor =
        senderType == 'VENDOR'
            ? new ObjectId(senderId)
            : new ObjectId(receiverId);

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
    messageId: ObjectId,
    data: MessageInput,
    database: Db = mongoDatabase
) => {
    const { senderType, senderId, receiverId } = data;

    const collection = database.collection<Chat>('chats');

    const userId = senderType == 'CLIENT' ? senderId : receiverId;

    const vendorId = senderType == 'VENDOR' ? senderId : receiverId;

    const filter: Filter<Chat> = {
        user: new ObjectId(userId),
        vendor: new ObjectId(vendorId),
    };

    const updatefilter: UpdateFilter<Chat> = {
        $push: { messages: messageId },
        $set: { updatedAt: new Date() },
    };

    const result = await collection.updateOne(filter, updatefilter);

    return result;
};

const createOrPushToChat = async (
    data: MessageInput,
    database: Db = mongoDatabase
) => {
    const message = await createMessage(data);
    const messageId = message.insertedId;
    let result: InsertOneResult<Chat> | UpdateResult<Chat>;

    const chat = await findChatByUsers(data, database);

    if (chat === null) {
        result = await createChat(messageId, data, database);
    } else {
        result = await pushMessageToChat(messageId, data, database);
    }

    if (!result.acknowledged) {
        throw Error('Message Creation Failed');
    }

    return messageId;
};

export {
    findChatById,
    findChatByUsers,
    findClientChatListByClientId,
    findVendorChatListByVendorId,
    createChat,
    pushMessageToChat,
    createOrPushToChat,
};
