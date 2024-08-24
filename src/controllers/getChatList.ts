import { GetChatListInput } from '@src/models/socketInputs';
import { Socket } from '..';
import { ChatList } from '@src/models/chat';
import { ChatListOutput } from '@src/models/socketOutputs';
import {
    findClientChatListByClientId,
    findVendorChatListByVendorId,
} from '@src/services/chat';

const getChatList = async (input: GetChatListInput, ws: Socket) => {
    const { senderId, senderType, inputType } = input;

    let chatList: ChatList | undefined = undefined;

    if (senderType === 'CLIENT') {
        chatList = await findClientChatListByClientId(input);
    }

    if (senderType === 'VENDOR') {
        chatList = await findVendorChatListByVendorId(input);
    }

    if (!chatList) {
        throw new Error('Chat list parsedMessaged failed to load');
    }

    const outputType =
        inputType === 'GET_MORE_CHAT_LIST'
            ? 'GET_MORE_CHAT_LIST'
            : 'GET_CHAT_LIST';

    const output: ChatListOutput = {
        chatList,
        outputType,
    };

    console.log(chatList);

    ws.send(JSON.stringify(output));
    console.log(`Successfully sent chat list ${senderType}:${senderId}`);
};

export default getChatList;
