import { ChatList } from './chat';
import { MessageList } from './message';
import { SocketInputType } from './socketInputs';

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

export { SocketOutputStatus, ChatListOutput, GetMessagesOutput };
