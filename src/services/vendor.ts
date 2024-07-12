import mongoDbClient from '@database/mongodb';
import { SwitchInput } from '@src/models/socketInputs';
import Vendor from '@src/models/vendor';
import { Db, Filter } from 'mongodb';

const mongoDatabase = mongoDbClient().db();

const findVendorIdByClerkId = async (
    data: SwitchInput,
    database: Db = mongoDatabase
) => {
    const { clerkId } = data;

    const collection = database.collection<Vendor>('vendors');

    const filter: Filter<Vendor> = { clerkId: clerkId };
    const projection = { _id: 1 };

    const result = await collection.findOne(filter, { projection });

    if (result == null) {
        throw Error('Vendor does not exist');
    }

    return result._id.toString();
};

export { findVendorIdByClerkId };
