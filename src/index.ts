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
    SwitchInput,
} from './models/socketInputs';
import { findMessagesByChatId } from './services/message';
import { findClientIdByClerkId } from './services/client';
import { findVendorIdByClerkId } from './services/vendor';
import { ChatList } from './models/chat';
import { ChatListOutput } from './models/socketOutputs';

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
    console.log('A Websocket has connected');

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
            try {
                const parsedMessaged = JSON.parse(message.toString());

                if (!parsedMessaged) {
                    throw Error('Data undefined');
                }

                console.log(`RECIEVED: ${parsedMessaged.inputType} EVENT`);

                const registerInput = parsedMessaged as RegisterInput;
                const { senderId, senderType } = registerInput;

                if (connections.has(senderId)) {
                    console.log(`User already connected`);
                } else {
                    connections.set(senderId, ws);
                    console.log(`User connected: ${senderType}: ${senderId}`);
                }

                if (parsedMessaged.inputType == 'SEND_MESSAGE') {
                    const messageInput = parsedMessaged as MessageInput;
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
                } else if (parsedMessaged.inputType === 'GET_CHAT_LIST') {
                    const {
                        senderId,
                        senderType,
                        inputType,
                        pageSize,
                        pageNumber,
                    } = parsedMessaged as GetChatListInput;
                    const chatListInput: GetChatListInput = {
                        senderId,
                        senderType,
                        inputType,
                        pageNumber,
                        pageSize,
                    };
                    console.log(chatListInput);
                    let chatList: ChatList | undefined = undefined;

                    if (senderType === 'CLIENT') {
                        chatList =
                            await findClientChatListByClientId(chatListInput);
                    }

                    if (senderType === 'VENDOR') {
                        chatList =
                            await findVendorChatListByVendorId(chatListInput);
                    }

                    if (!chatList) {
                        throw new Error(
                            'Chat list parsedMessaged failed to load'
                        );
                    }

                    const output: ChatListOutput = {
                        chatList,
                        outputType: 'GET_CHAT_LIST',
                    };

                    ws.send(JSON.stringify(output));
                    console.log(
                        `Successfully sent chat list ${senderType}:${senderId}`
                    );
                } else if (parsedMessaged.inputType === 'GET_MESSAGES') {
                    const getMessagesInput = parsedMessaged as GetMessagesInput;
                    const messages =
                        await findMessagesByChatId(getMessagesInput);

                    ws.send(JSON.stringify(messages));
                    console.log(
                        `Successfully sent messages from CHAT ID:${getMessagesInput.chatId}`
                    );
                } else if (parsedMessaged.inputType === 'SWITCH') {
                    const switchInput = parsedMessaged as SwitchInput;
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
                ws.send(JSON.stringify(error));
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
