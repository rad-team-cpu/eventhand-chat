import { ObjectId } from 'mongodb';

type Vendor = {
    _id: ObjectId;
    clerkId: string;
};

export default Vendor;
