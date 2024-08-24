import 'dotenv/config';
import { ObjectId } from 'mongodb';
import { faker } from '@faker-js/faker';
import mongoDbClient from './index';

const chats = [
    {
        _id: new ObjectId(),
        user: {
            id: new ObjectId(),
            clerkId: 'user1_clerk_id',
            email: 'user1@example.com',
            profilePicture: 'user1.jpg',
            lastName: 'Doe',
            firstName: 'John',
            contactNumber: '1234567890',
            gender: 'Male',
            events: [],
            chats: [],
            vendor: null,
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        vendor: {
            id: new ObjectId(),
            clerkId: 'vendor1_clerk_id',
            email: 'vendor1@example.com',
            profilePicture: 'vendor1.jpg',
            name: 'Vendor One',
            address: '123 Vendor St, Vendorville',
            contactNumber: '0987654321',
            bio: 'Lorem ipsum dolor sit amet.',
            logo: 'vendor1_logo.jpg',
            tags: [],
            visibility: true,
            credibiltyfactor: 0.9,
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
    },
];

const createMessageData = (userId: string, vendorId: string) => {
    const date = faker.date.anytime();

    const senderId = getRandomId(userId, vendorId);

    return {
        _id: new ObjectId(),
        senderId: new ObjectId(senderId),
        content: faker.lorem.sentence({ min: 3, max: 20 }),
        timestamp: date,
        createdAt: date,
        updatedAt: date,
    };
};

const getRandomId = (userId: string, vendorId: string) => {
    const randomIndex = Math.random() < 0.5 ? 0 : 1;
    return randomIndex === 0 ? userId : vendorId;
};

const createManyMessageData = (
    userId: string,
    vendorId: string,
    count: number
) => {
    return Array.from(Array(count), () => createMessageData(userId, vendorId));
};

const createChatData = (ids: { userId: string; vendorId: string }) => {
    const { userId, vendorId } = ids;

    return {
        _id: new ObjectId(),
        user: new ObjectId(userId),
        vendor: new ObjectId(vendorId),
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
    };
};

const client = mongoDbClient();

// Function to seed data into MongoDB
async function seedData() {
    mongoDbClient()
        .on('serverOpening', () => console.log('DB Connected: Seed Start'))
        .on('serverClosed', () => console.log('DB Disconnected: Seed Done'))
        .on('error', (error) =>
            console.log('An Error has Occured while Seeding:', error)
        )
        .connect();

    const userId = '66bdcd9807098fd9245c6b72';
    const vendorId = '66a1f5d736a26dc79eeca3f2';

    try {
        const database = client.db();
        const chatsCollection = database.collection('chats');
        const messagesCollection = database.collection('messages');
        const chatData = createChatData({ userId, vendorId });
        const messagesData = createManyMessageData(userId, vendorId, 10);

        const insertChatResult = await chatsCollection.insertOne(chatData);
        console.log(`Inserted chat with ID: ${insertChatResult.insertedId}`);

        const chatId = insertChatResult.insertedId;
        chatData._id = chatId;

        // Insert messages and update chat with message IDs
        const messageIds: ObjectId[] = [];
        for (const messageData of messagesData) {
            const insertMessageResult =
                await messagesCollection.insertOne(messageData);
            const messageId = insertMessageResult.insertedId;
            messageIds.push(messageId);
        }

        // Update chat document with message IDs
        await chatsCollection.updateOne(
            { _id: chatId },
            { $set: { messages: messageIds } }
        );
    } catch (err) {
        console.error('Error seeding data:', err);
    } finally {
        await client.close();
    }
}

// Call the seedData function to execute seeding
seedData();
