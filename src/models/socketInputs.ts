import { z } from 'zod';

const socketInputTypeSchema = z.union([
    z.literal('REGISTER'),
    z.literal('SEND_MESSAGE'),
    z.literal('GET_MESSAGES'),
    z.literal('GET_CHAT_LIST'),
    z.literal('SWITCH'),
    z.literal('GET_EARLIER_MESSAGES'),
]);

type SocketInputType = z.infer<typeof socketInputTypeSchema>;

const senderTypeSchema = z.union([z.literal('VENDOR'), z.literal('CLIENT')]);

const registerInputTypeSchema = z.object({
    senderId: z.coerce.string(),
    senderType: senderTypeSchema,
    inputType: socketInputTypeSchema,
});

type RegisterInput = z.infer<typeof registerInputTypeSchema>;

const messageInputSchema = z.intersection(
    registerInputTypeSchema,
    z.object({
        chatId: z.coerce.string(),
        receiverId: z.coerce.string(),
        content: z.coerce.string(),
        timestamp: z.coerce.date(),
        isImage: z.coerce.boolean().optional(),
    })
);

type MessageInput = z.infer<typeof messageInputSchema>;

const getChatListInputSchema = z.intersection(
    registerInputTypeSchema,
    z.object({
        pageNumber: z.coerce.number(),
        pageSize: z.coerce.number(),
    })
);

type GetChatListInput = z.infer<typeof getChatListInputSchema>;

const getMessagesInputSchema = z.intersection(
    registerInputTypeSchema,
    z.object({
        receiverId: z.coerce.string(),
        pageNumber: z.coerce.number(),
        pageSize: z.coerce.number(),
    })
);

type GetMessagesInput = z.infer<typeof getMessagesInputSchema>;

const switchInputSchema = z.intersection(
    registerInputTypeSchema,
    z.object({
        clerkId: z.string(),
    })
);

type SwitchInput = z.infer<typeof switchInputSchema>;

const socketInputSchema = z.union([
    registerInputTypeSchema,
    messageInputSchema,
    getChatListInputSchema,
    getMessagesInputSchema,
    switchInputSchema,
]);

type SocketInput = z.infer<typeof socketInputSchema>;

export {
    SocketInputType,
    RegisterInput,
    registerInputTypeSchema,
    MessageInput,
    messageInputSchema,
    GetChatListInput,
    getChatListInputSchema,
    GetMessagesInput,
    getMessagesInputSchema,
    switchInputSchema,
    SwitchInput,
    socketInputSchema,
    SocketInput,
};
