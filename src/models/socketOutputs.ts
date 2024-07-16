import { ChatList } from './chat';
import { SocketInputType } from './socketInputs';

type SocketOutputStatus = {
    status: 'SUCCESS' | 'ERROR';
};

type ChatListOutput = {
    chatList: ChatList;
    outputType: SocketInputType;
};

export { SocketOutputStatus, ChatListOutput };
