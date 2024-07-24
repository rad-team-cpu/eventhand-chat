// import 'dotenv/config';
import 'dotenv/config';
import mongoDbClient from '@database/mongodb';
import WebSocket, { WebSocketServer } from 'ws';
import verifyClerkToken from './middleware/verifyToken';
import {
    GetChatListInput,
    GetMessagesInput,
    MessageInput,
    RegisterInput,
    SwitchInput,
} from './models/socketInputs';
import sendChatMessage from './controllers/sendChatMessage';
import getMessages from './controllers/getMessages';
import getChatList from './controllers/getChatList';

export interface Socket extends WebSocket {
    isAlive?: boolean;
}

const port = Number(process.env.PORT) || 3000;

const wsServer = new WebSocketServer({ port });

const connections = new Map<string, Socket>();

mongoDbClient()
    .on('serverOpening', () => console.log('DB Connected'))
    .on('serverClosed', () => console.log('DB Disconnected'))
    .on('error', (error) => console.log('An Error has Occured:', error))
    .connect();

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

                if (parsedMessaged.inputType === 'SWITCH') {
                    const switchInput = parsedMessaged as SwitchInput;
                    const { senderId, senderType } = switchInput;

                    for (const [userId] of connections.entries()) {
                        if (userId === senderId) {
                            connections.delete(userId);

                            const switchedType =
                                senderType === 'CLIENT' ? 'VENDOR' : 'CLIENT';
                            console.log(`${senderType} to ${switchedType}`);
                            break;
                        }
                    }
                }

                console.log(connections.forEach((e, key) => console.log(key)));

                if (parsedMessaged.inputType == 'SEND_MESSAGE') {
                    const messageInput = parsedMessaged as MessageInput;
                    await sendChatMessage(messageInput, ws, connections);
                } else if (parsedMessaged.inputType === 'GET_CHAT_LIST') {
                    const getChatListInput = parsedMessaged as GetChatListInput;
                    await getChatList(getChatListInput, ws);
                } else if (parsedMessaged.inputType === 'GET_MESSAGES') {
                    const getMessagesInput = parsedMessaged as GetMessagesInput;
                    await getMessages(getMessagesInput, ws);
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
