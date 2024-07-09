import { z } from 'zod';
import { Message, messageInputSchema } from './message';
import { User, userInputSchema } from './user';
import { Vendor, vendorInputSchema } from './vendor';
import { ObjectId } from 'mongodb';

type Chat = {
    _id: ObjectId;
    user: User;
    vendor: Vendor;
    messages: Message[];
    createdAt: Date;
    updatedAt: Date;
};

const chatInputSchema = z.object({
    _id: z.coerce.string().optional(),
    user: userInputSchema.optional(),
    vendor: vendorInputSchema.optional(),
    message: messageInputSchema,
});

type ChatInput = z.infer<typeof chatInputSchema>;

export { Chat, ChatInput, chatInputSchema };
