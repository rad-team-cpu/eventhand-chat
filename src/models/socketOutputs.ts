import { ChatList } from './chat';
import { Message, MessageList } from './message';
import { SocketInputType } from './socketInputs';

type SocketOutputType = SocketInputType | 'CHAT_MESSAGE_RECEIVED';

type SocketOutputStatus = {
    status: 'SUCCESS' | 'ERROR';
};

type ChatListOutput = {
    chatList: ChatList;
    outputType: SocketInputType;
};

type GetMessagesOutput = {
    messageList: MessageList;
    outputType: SocketInputType;
};

type SendMessageOutput = {
    message: Message;
    outputType: SocketOutputType;
};

export {
    SocketOutputStatus,
    ChatListOutput,
    GetMessagesOutput,
    SendMessageOutput,
};
