// import 'dotenv/config';
import 'dotenv/config';
import mongoDbClient from '@database/mongodb';
import {
    createChat,
    findChatListsById,
    pushMessageToChat,
} from '@src/services/chat';
import WebSocket, { WebSocketServer } from 'ws';
import verifyClerkToken from './middleware/verifyToken';
import {
    GetChatListInput,
    GetMessagesInput,
    MessageInput,
    RegisterInput,
    socketInputSchema,
} from './models/socketInputs';
import { findMessagesByChatId } from './services/message';

const port = Number(process.env.PORT) || 3000;

// const onStart = () =>
//     console.log(`SERVER START: eventhand-chat listening at ${PORT}`);

// // eslint-disable-next-line @typescript-eslint/no-explicit-any
// const onError = (error: any) => {
//     if (error.syscall !== 'listen') {
//         console.log(error);
//         throw error;
//     }

//     switch (error.code) {
//         case 'EACCESS':
//             console.error('Insufficient permissions to start server:', error);
//             process.exit(1);
//             break;
//         case 'EADDRINUSE':
//             console.error(`Port ${PORT} is already in use`);
//             process.exit(1);
//             break;
//         default:
//             console.log('An Error has occured:', error);
//             throw error;
//     }
// };

// const httpServer = app.listen(PORT, onStart);

// const onListening = () => {
//     const addr = httpServer.address();
//     const bind =
//         typeof addr === 'string' ? `pipe ${addr}` : `port ${addr?.port}`;
//     console.log(`Listening on ${bind}`);
// };

// httpServer.on('listening', onListening).on('error', onError);

const wsServer = new WebSocketServer({ port });

const connections = new Map<string, WebSocket>();

mongoDbClient().connect();

wsServer.on('connection', async (ws, req) => {
    console.log('New WebSocket client connected');

    const token = req.headers.authorization;

    if (!token) {
        console.log('No token provided');
        ws.close(1000, 'No token provided');
        return;
    }

    const verifiedToken = await verifyClerkToken(token);

    if (verifiedToken) {
        ws.on('message', async (message) => {
            console.log('Received:', message);

            const validData = socketInputSchema.safeParse(message);

            const { success, data } = validData;

            if (!success) {
                const validationError = validData.error.issues;
                console.log(validationError);
                const status = JSON.stringify({ status: 'ERROR' });
                ws.send(status);
                return;
            }

            try {
                if (data == undefined) {
                    throw Error('Data undefined');
                }

                if (data.inputType == 'Register') {
                    const registerInput = data as RegisterInput;
                    const { senderId } = registerInput;

                    connections.set(senderId, ws);
                    console.log(`User connected: ${senderId}`);
                } else if (data.inputType == 'Send_Message') {
                    const messageInput = data as MessageInput;
                    const { chatId, receiverId } = messageInput;

                    if (!chatId) {
                        await createChat(messageInput);
                    } else {
                        await pushMessageToChat(messageInput);
                    }

                    const receiverWs = connections.get(receiverId);

                    if (receiverWs && receiverWs.readyState === 1) {
                        const receiverMessage = JSON.stringify(messageInput);

                        receiverWs.send(receiverMessage, (err) => {
                            console.error(
                                'Error has occured while sending:',
                                err
                            );
                            const status = JSON.stringify({ status: 'ERROR' });
                            ws.send(status);
                            return;
                        });

                        const status = JSON.stringify({ status: 'SENT' });

                        ws.send(status);
                    }
                } else if (data.inputType === 'Get_Chat_List') {
                    const chatListInput = data as GetChatListInput;
                    const chatList = await findChatListsById(chatListInput);

                    ws.send(JSON.stringify(chatList));
                } else if (data.inputType === 'Get_Messages') {
                    const getMessagesInput = data as GetMessagesInput;
                    const messages =
                        await findMessagesByChatId(getMessagesInput);

                    ws.send(JSON.stringify(messages));
                }
            } catch (error) {
                console.error(error);
                const status = JSON.stringify({ status: 'ERROR' });
                ws.send(status);
            }
        });
    } else {
        console.log('Invalid token');
        ws.close(1000, 'Invalid token');
        return;
    }

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });

    ws.on('close', () => {
        for (const [userId, userWs] of connections.entries()) {
            if (userWs === ws) {
                connections.delete(userId);
                console.log(`User disconnected: ${userId}`);
                break;
            }
        }
    });
});
