import { ObjectId } from 'mongodb';

type User = {
    _id: ObjectId;
    name: string;
};

export default User;
