import { MongoClient } from 'mongodb';

let client: MongoClient;

const mongoDbClient = () => {
    console.log(process.env.MONGODB_CONNECTION_URI);
    console.log(process.env.path);
    if (!client) {
        return (client = new MongoClient(process.env.MONGODB_CONNECTION_URI!));
    }

    return client;
};

export default mongoDbClient;
