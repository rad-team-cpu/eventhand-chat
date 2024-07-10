import { messageInputSchema } from '@src/models/message';
import { createChat, pushMessageToChat } from '@src/services/chat';
import WebSocket, { WebSocketServer } from 'ws';

const port = Number(process.env.PORT) || 3000;

const wsServer = new WebSocketServer({ port });

const connections = new Map<string, WebSocket>();

wsServer.on('connection', (ws) => {
    console.log('New WebSocket client connected');

    ws.on('message', async (message) => {
        console.log('Received:', message);

        const validData = messageInputSchema.safeParse(message);

        const { success, data } = validData;

        try {
            if (!success) {
                const validationError = validData.error.issues[0];
                const errMessage = JSON.stringify({ error: validationError });
                ws.send(errMessage);
            }

            if (data == undefined) {
                throw Error('Data undefined');
            }

            const { chatId, senderId, receiverId } = data;

            connections.set(senderId, ws);
            console.log(`User connected: ${senderId}`);

            if (!chatId) {
                await createChat(data);
            } else {
                await pushMessageToChat(data);
            }

            const receiverWs = connections.get(receiverId);
            if (receiverWs && receiverWs.readyState === WebSocket.OPEN) {
                const receiverMessage = JSON.stringify(data);

                receiverWs.send(receiverMessage);
            }
        } catch (error) {
            console.error(error);
        }
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });

    ws.on('close', () => {
        for (const [receiverId, connectedWs] of connections.entries()) {
            if (connectedWs === ws) {
                connections.delete(receiverId);
                console.log(`User disconnected: ${receiverId}`);
                break;
            }
        }
    });
});

export default wsServer;
