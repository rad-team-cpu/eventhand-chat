// import 'dotenv/config';
import dotenv from 'dotenv';
import app from '@src/app';
import mongoDbClient from '@database/mongodb';

dotenv.config({ path: './.env' });

const PORT = process.env.PORT || 3000;

const onStart = () =>
    console.log(`SERVER START: eventhand-chat listening at ${PORT}`);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const onError = (error: any) => {
    if (error.syscall !== 'listen') {
        console.log(error);
        throw error;
    }

    switch (error.code) {
        case 'EACCESS':
            console.error('Insufficient permissions to start server:', error);
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(`Port ${PORT} is already in use`);
            process.exit(1);
            break;
        default:
            console.log('An Error has occured:', error);
            throw error;
    }
};

const httpServer = app.listen(PORT, onStart);

const onListening = () => {
    const addr = httpServer.address();
    const bind =
        typeof addr === 'string' ? `pipe ${addr}` : `port ${addr?.port}`;
    console.log(`Listening on ${bind}`);
};

httpServer.on('listening', onListening).on('error', onError);

mongoDbClient()
    .on('connectionPoolReady', () =>
        console.log(`DB CONNECTED: @${process.env.MONGODB_CONNECTION_URI}`)
    )
    .on('error', () => console.error('DB ERROR'))
    .connect();
