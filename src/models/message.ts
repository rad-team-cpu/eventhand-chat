import { ObjectId } from 'mongodb';
import { z } from 'zod';

type Message = {
    _id: ObjectId;
    senderId: string;
    content: string;
    timestamp: Date;
    createdAt?: Date;
    updatedAt?: Date;
};

const messageInputSchema = z.object({
    chatId: z.coerce.string().optional(),
    senderId: z.coerce.string(),
    senderName: z.coerce.string(),
    receiverId: z.coerce.string(),
    receiverName: z.coerce.string(),
    content: z.coerce.string(),
    timestamp: z.coerce.date(),
    senderType: z.union([z.literal('VENDOR'), z.literal('CLIENT')]),
});

type MessageInput = z.infer<typeof messageInputSchema>;

export { Message, MessageInput, messageInputSchema };
