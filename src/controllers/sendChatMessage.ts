import { ChatList } from '@src/models/chat';
import { Message } from '@src/models/message';
import { GetChatListInput, MessageInput } from '@src/models/socketInputs';
import { ChatListOutput } from '@src/models/socketOutputs';
import {
    createOrPushToChat,
    findClientChatListByClientId,
    findVendorChatListByVendorId,
} from '@src/services/chat';
import { Socket } from '..';

const sendChatMessage = async (
    message: MessageInput,
    ws: Socket,
    connections: Map<string, Socket>
) => {
    const { senderId, senderType, receiverId, timestamp, content, isImage } =
        message;

    const messageId = await createOrPushToChat({
        ...message,
        timestamp: new Date(timestamp),
    });

    console.log(`Chat message ${messageId} recieved and saved to database`);

    const chatListInput: GetChatListInput = {
        senderId,
        senderType,
        inputType: 'GET_CHAT_LIST',
        pageNumber: 1,
        pageSize: 10,
    };

    let chatList: ChatList | undefined = undefined;

    if (senderType === 'CLIENT') {
        chatList = await findClientChatListByClientId(chatListInput);
    }

    if (senderType === 'VENDOR') {
        chatList = await findVendorChatListByVendorId(chatListInput);
    }

    if (!chatList) {
        throw new Error('Chat list parsedMessaged failed to load');
    }

    const output: ChatListOutput = {
        chatList,
        outputType: 'GET_CHAT_LIST',
    };

    ws.send(JSON.stringify(output));
    console.log(`Successfully updated chat list ${senderType}:${senderId}`);

    const receiverWs = connections.get(receiverId);

    if (receiverWs && receiverWs.readyState === 1) {
        const receiverType = senderType === 'CLIENT' ? 'VENDOR' : 'CLIENT';

        const chatListInput: GetChatListInput = {
            senderId: receiverId,
            senderType: receiverType,
            inputType: 'GET_CHAT_LIST',
            pageNumber: 1,
            pageSize: 10,
        };

        let receiverChatList: ChatList | undefined = undefined;

        if (senderType === 'CLIENT') {
            receiverChatList =
                await findVendorChatListByVendorId(chatListInput);
        }

        if (senderType === 'VENDOR') {
            receiverChatList =
                await findClientChatListByClientId(chatListInput);
        }

        if (!receiverChatList) {
            throw new Error('Chat list parsedMessaged failed to load');
        }

        const receiverChatListOutput: ChatListOutput = {
            chatList: receiverChatList,
            outputType: 'GET_CHAT_LIST',
        };

        receiverWs.send(JSON.stringify(receiverChatListOutput));
        console.log(`Successfully updated RECEIVER CHAT LIST: ${receiverId}`);

        const receiverMessage: Message = {
            _id: messageId,
            senderId: senderId,
            content,
            timestamp: new Date(timestamp),
            isImage,
        };

        const receiverMessageOutput = {
            message: receiverMessage,
            outputType: 'CHAT_MESSAGE_RECEIVED',
        };

        receiverWs.send(JSON.stringify(receiverMessageOutput));
        console.log(`SUCCESSFULLY SENT MESSAGE TO RECEIVER: ${receiverId}`);
    }
};

export default sendChatMessage;
