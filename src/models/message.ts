import { ObjectId } from 'mongodb';
import { z } from 'zod';

type Message = {
    _id: ObjectId;
    senderId: string;
    content: string;
    timestamp: Date;
    createdAt: Date;
    updatedAt: Date;
};

const messageInputSchema = z.object({
    senderId: z.coerce.string(),
    content: z.coerce.string(),
    timestamp: z.coerce.date(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
});

type MessageInput = z.infer<typeof messageInputSchema>;

export { Message, MessageInput, messageInputSchema };
