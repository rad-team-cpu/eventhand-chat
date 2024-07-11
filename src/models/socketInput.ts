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

export { SocketInput, socketInputSchema };
