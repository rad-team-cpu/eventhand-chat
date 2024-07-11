// import 'dotenv/config';
import 'dotenv/config';
import mongoDbClient from '@database/mongodb';
import { messageInputSchema } from '@src/models/message';
import { createChat, pushMessageToChat } from '@src/services/chat';
import WebSocket, { WebSocketServer } from 'ws';
import verifyClerkToken from './middleware/verifyToken';

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

wsServer.on('connection', async (ws, req) => {
    console.log('New WebSocket client connected');

    mongoDbClient()
        .on('connectionPoolReady', () =>
            console.log(`DB CONNECTED: @${process.env.MONGODB_CONNECTION_URI}`)
        )
        .on('error', () => console.error('DB ERROR'))
        .connect();

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

            const validData = messageInputSchema.safeParse(message);

            const { success, data } = validData;

            try {
                if (!success) {
                    const validationError = validData.error.issues[0];
                    const errMessage = JSON.stringify({
                        error: validationError,
                    });
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

                if (receiverWs && receiverWs.readyState === 1) {
                    const receiverMessage = JSON.stringify(data);

                    receiverWs.send(receiverMessage);
                }
            } catch (error) {
                console.error(error);
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
        for (const [receiverId, connectedWs] of connections.entries()) {
            if (connectedWs === ws) {
                connections.delete(receiverId);
                console.log(`User disconnected: ${receiverId}`);
                break;
            }
        }
    });
});
