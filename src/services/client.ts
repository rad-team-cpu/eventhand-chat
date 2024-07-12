import mongoDbClient from '@database/mongodb';
import { SwitchInput } from '@src/models/socketInputs';
import Client from '@src/models/client';
import { Db, Filter } from 'mongodb';

const mongoDatabase = mongoDbClient().db();

const findClientIdByClerkId = async (
    data: SwitchInput,
    database: Db = mongoDatabase
) => {
    const { clerkId } = data;

    const collection = database.collection<Client>('vendors');

    const filter: Filter<Client> = { clerkId: clerkId };
    const projection = { _id: 1 };

    const result = await collection.findOne(filter, { projection });

    if (result == null) {
        throw Error('Client does not exist');
    }

    return result._id.toString();
};

export { findClientIdByClerkId };
