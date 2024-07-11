import { z } from 'zod';

const socketInputTypeSchema = z.union([
    z.literal('Register'),
    z.literal('Send_Message'),
    z.literal('Get_Messages'),
    z.literal('Get_Chat_List'),
]);

const socketInputSchema = z.object({
    chatId: z.coerce.string().optional(),
    senderId: z.coerce.string(),
    senderName: z.coerce.string(),
    receiverId: z.coerce.string(),
    receiverName: z.coerce.string(),
    content: z.coerce.string(),
    timestamp: z.coerce.date(),
    senderType: z.union([z.literal('VENDOR'), z.literal('CLIENT')]),
    inputType: socketInputTypeSchema,
});

type SocketInput = z.infer<typeof socketInputSchema>;

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

export {
    SocketInput,
    socketInputSchema,
    GetChatListInput,
    getChatListInputSchema,
    GetMessagesInput,
    getMessagesInputSchema,
};
