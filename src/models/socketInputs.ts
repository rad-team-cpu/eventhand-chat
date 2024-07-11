import { z } from 'zod';

const socketInputTypeSchema = z.union([
    z.literal('Register'),
    z.literal('Send_Message'),
    z.literal('Get_Messages'),
    z.literal('Get_Chat_List'),
]);

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
        chatId: z.coerce.string().optional(),
        senderName: z.coerce.string(),
        receiverId: z.coerce.string(),
        receiverName: z.coerce.string(),
        content: z.coerce.string(),
        timestamp: z.coerce.date(),
    })
);

type MessageInput = z.infer<typeof messageInputSchema>;

const getChatListInputSchema = z.object({
    senderId: z.coerce.string(),
    senderType: z.union([z.literal('VENDOR'), z.literal('CLIENT')]),
    pageNumber: z.coerce.number(),
    pageSize: z.coerce.number(),
    inputType: socketInputTypeSchema,
});

type GetChatListInput = z.infer<typeof getChatListInputSchema>;

const getMessagesInputSchema = z.object({
    chatId: z.coerce.string(),
    inputType: socketInputTypeSchema,
});

type GetMessagesInput = z.infer<typeof getMessagesInputSchema>;

const socketInputSchema = z.union([
    registerInputTypeSchema,
    messageInputSchema,
    getChatListInputSchema,
    getMessagesInputSchema,
]);

type SocketInput = z.infer<typeof socketInputSchema>;

export {
    RegisterInput,
    registerInputTypeSchema,
    MessageInput,
    messageInputSchema,
    GetChatListInput,
    getChatListInputSchema,
    GetMessagesInput,
    getMessagesInputSchema,
    socketInputSchema,
    SocketInput,
};
