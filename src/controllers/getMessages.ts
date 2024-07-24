import { MessageList } from '@src/models/message';
import { GetMessagesInput } from '@src/models/socketInputs';
import { GetMessagesOutput, SocketOutputType } from '@src/models/socketOutputs';
import { findMessagesByUsers } from '@src/services/message';
import { Socket } from '..';

const getMessages = async (input: GetMessagesInput, ws: Socket) => {
    const { inputType } = input;
    const messageList: MessageList = await findMessagesByUsers(input);

    const outputType: SocketOutputType =
        inputType === 'GET_EARLIER_MESSAGES'
            ? 'GET_EARLIER_MESSAGES'
            : 'GET_MESSAGES';

    const output: GetMessagesOutput = {
        messageList,
        outputType,
    };

    ws.send(JSON.stringify(output));
    console.log(`SUCCESSFULLY SENT CHAT MESSAGES`);
};

export default getMessages;
