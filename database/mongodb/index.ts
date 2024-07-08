import { MongoClient } from 'mongodb';

let client: MongoClient;

const mongoDbClient = () => {
    if (!client) {
        return (client = new MongoClient(process.env.MONGODB_CONNECTION_URI!));
    }

    return client;
};

export default mongoDbClient;
