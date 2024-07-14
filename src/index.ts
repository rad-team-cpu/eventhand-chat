// import 'dotenv/config';
import 'dotenv/config';
import mongoDbClient from '@database/mongodb';
import {
    createChat,
    findClientChatListByClientId,
    findVendorChatListByVendorId,
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
    SwitchInput,
} from './models/socketInputs';
import { findMessagesByChatId } from './services/message';
import { findClientIdByClerkId } from './services/client';
import { findVendorIdByClerkId } from './services/vendor';
import { ChatList } from './models/chat';

const port = Number(process.env.PORT) || 3000;

const wsServer = new WebSocketServer({ port });

const connections = new Map<string, WebSocket>();

mongoDbClient()
    .on('serverOpening', () => console.log('DB Connected'))
    .on('serverClosed', () => console.log('DB Disconnected'))
    .on('error', (error) => console.log('An Error has Occured:', error))
    .connect();

interface Socket extends WebSocket {
    isAlive?: boolean;
}

const heartbeatInterval = 30000; // Interval in milliseconds

const heartbeat = (wss: WebSocketServer, interval: number) => {
    return setInterval(() => {
        wsServer.clients.forEach((ws: Socket) => {
            if (!ws.isAlive) {
                // Terminate the connection if client didn't respond to the last heartbeat
                return ws.terminate();
            }

            // Reset the heartbeat status
            ws.isAlive = false;
            // Send a heartbeat message to the client
            ws.ping();
        });
    }, interval);
};

wsServer.on('connection', async (ws: Socket, req) => {
    console.log('New WebSocket client connected');

    ws.isAlive = true;

    const token = req.url?.split('token=')[1];

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

                if (data.inputType == 'REGISTER') {
                    const registerInput = data as RegisterInput;
                    const { senderId, senderType } = registerInput;

                    if (connections.has(senderId)) {
                        console.log(`User already connected`);
                        return;
                    }

                    connections.set(senderId, ws);
                    console.log(`User connected: ${senderType}: ${senderId}`);
                } else if (data.inputType == 'SEND_MESSAGE') {
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

                        console.log(
                            `Message successfully sent to RECIEVER:${receiverId}`
                        );
                    }
                } else if (data.inputType === 'GET_CHAT_LIST') {
                    const chatListInput = data as GetChatListInput;
                    const { senderType } = chatListInput;
                    let chatList: ChatList | undefined = undefined;

                    if (senderType === 'CLIENT') {
                        chatList =
                            await findClientChatListByClientId(chatListInput);
                    }

                    if (senderType === 'VENDOR') {
                        chatList =
                            await findVendorChatListByVendorId(chatListInput);
                    }

                    ws.send(JSON.stringify(chatList));
                    console.log(
                        `Successfully sent chat list to SENDER:${chatListInput.senderId}`
                    );
                } else if (data.inputType === 'GET_MESSAGES') {
                    const getMessagesInput = data as GetMessagesInput;
                    const messages =
                        await findMessagesByChatId(getMessagesInput);

                    ws.send(JSON.stringify(messages));
                    console.log(
                        `Successfully sent messages from CHAT ID:${getMessagesInput.chatId}`
                    );
                } else if (data.inputType === 'SWITCH') {
                    const switchInput = data as SwitchInput;
                    const { senderId, senderType } = switchInput;

                    let id: string = senderId;

                    if (senderType === 'CLIENT') {
                        id = await findClientIdByClerkId(switchInput);
                    }

                    if (senderType === 'VENDOR') {
                        id = await findVendorIdByClerkId(switchInput);
                    }

                    for (const [userId] of connections.entries()) {
                        if (userId === senderId) {
                            connections.delete(userId);
                            connections.set(id, ws);

                            const switchedType =
                                senderType === 'CLIENT' ? 'VENDOR' : 'CLIENT';
                            console.log(
                                `User Switched from ${senderType} to ${switchedType}:  ${id}`
                            );
                            break;
                        }
                    }
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

    ws.on('pong', () => {
        ws.isAlive = true;
    });

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

heartbeat(wsServer, heartbeatInterval);
