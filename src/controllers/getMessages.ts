import { MessageList } from '@src/models/message';
import { GetMessagesInput } from '@src/models/socketInputs';
import { GetMessagesOutput } from '@src/models/socketOutputs';
import { findMessagesByUsers } from '@src/services/message';
import { Socket } from '..';

const getMessages = async (input: GetMessagesInput, ws: Socket) => {
    const messages: MessageList = await findMessagesByUsers(input);

    const output: GetMessagesOutput = {
        messageList: messages,
        outputType: 'GET_MESSAGES',
    };

    ws.send(JSON.stringify(output));
    console.log(`SUCCESSFULLY SENT CHAT MESSAGES`);
};

export default getMessages;
