import { ObjectId } from 'mongodb';

type Client = {
    _id: ObjectId;
    clerkId: string;
};

export default Client;
