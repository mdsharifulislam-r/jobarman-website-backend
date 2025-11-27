import { JwtPayload } from 'jsonwebtoken';
import QueryBuilder from '../../builder/QueryBuilder';
import { IMessage } from './message.interface';
import { Message } from './message.model';
import { Chat } from '../chat/chat.model';
import { generateZoomLink } from '../../../helpers/zoomHelper';

const sendMessageToDB = async (payload: Partial<IMessage>): Promise<IMessage> => {
  // save to DB

if(payload.type=="zoom-link"){
  const link= await generateZoomLink()
  payload.text=link;
}

  const response = await Message.create(payload);
  const receiver = (await Chat.findById(payload.chatId))?.participants.filter(
    (participant) => participant?.toString() as any != payload?.sender!
  )[0];

  //@ts-ignore
  const io = global.io;
  if (io) {
    console.log("dsds");
    
    io.emit(`getMessage::${payload?.chatId}`, response);
    io.emit(`chatList::${payload?.sender}`, response);
    io.emit(`chatList::${receiver}`, response);
    
  }

  await Chat.findOneAndUpdate({_id:payload.chatId},{})

  return response;
};

const getMessageFromDB = async (id: any,query:Record<string,any>,user:JwtPayload) => {
  const seenAllMessage = await Message.updateMany(
    { chatId: id, seenBy: { $nin: [user?.id] } },
    { $push: { seenBy: user?.id } }
  );
  const chat = await Chat.findById(id);
  if(!chat) throw new Error('Chat not found');
  const anotherParticipant = chat.participants.filter(
    (participant) => participant.toString() !== user?.id
  )[0]
  
  const MessageQuery = new QueryBuilder(
    Message.find({ chatId: id }),
    query
  ).paginate()
  const [messages, pagination] = await Promise.all([
    MessageQuery.modelQuery.lean(),
    MessageQuery.getPaginationInfo(),
  ]);

  return {
    pagination,
    messages:messages.map((message: any) => {
 
      
      return {
        ...message,
        seen: message.seenBy.map((id: string) => id.toString()).includes(anotherParticipant.toString()),
      };
    })
  }
};

export const MessageService = { sendMessageToDB, getMessageFromDB };
