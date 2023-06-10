import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';

import { getDataSource, getUser } from '../../../utils/server/rdbms';
import { NEXT_PUBLIC_NEXTAUTH_ENABLED } from '@/utils/app/const';

import {
  RDBMSConversation,
  RDBMSFolder,
  RDBMSUser,
  RDBMSMessage,
} from '../../../types/rdbms';
import { Conversation } from '@/types/chat';
import { Message, Role } from '@/types/chat';
import { OpenAIModelID, OpenAIModels } from '@/types/openai';

import { authOptions } from './../auth/[...nextauth]';

import { DataSource } from 'typeorm';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  let userId = '';
  if (NEXT_PUBLIC_NEXTAUTH_ENABLED) {
    const session = await getServerSession(req, res, authOptions);

    if (!session) {
      return res.status(401).json({ error: 'User is not authenticated' });
    } else if (!session.user) {
      return res.status(401).json({ error: 'User is not authenticated' });
    } else if (!session.user.email) {
      return res
        .status(401)
        .json({ error: 'User does not have an email address' });
    }
    userId = session.user.email;
  } else {
    userId = 'test_user';
  }

  const dataSource = await getDataSource();
  const user = await getUser(dataSource, userId);

  let body;
  if (req.body !== '') {
    body = JSON.parse(req.body);
  }

  if (req.method === 'POST') {
    const newConversation = body;
    if (newConversation !== null) {
      return await rdbmsCreateConversation(
        res,
        dataSource,
        user,
        newConversation,
      );
    } else {
      await dataSource.destroy();
      return res.status(400).json({ error: 'No conversation provided' });
    }
  } else if (req.method === 'PUT') {
    const updatedConversation = body;
    if (updatedConversation !== null) {
      return await rdbmsUpdateConversation(
        res,
        dataSource,
        user,
        updatedConversation,
      );
    } else {
      await dataSource.destroy();
      return res.status(400).json({ error: 'No conversation provided' });
    }
  } else if (req.method === 'DELETE') {
    const conversationId = body['conversation_id'];
    if (conversationId !== undefined) {
      return await rdbmsDeleteConversation(
        res,
        dataSource,
        user,
        conversationId,
      );
    } else {
      await dataSource.destroy();
      return res.status(400).json({ error: 'No conversation_id provided' });
    }
  } else if (req.method === 'GET') {
    const query = req.query;
    const { conversation_id } = query;
    const conversationId = conversation_id;
    if (conversationId !== undefined) {
      return await rdbmsGetConversation(
        res,
        dataSource,
        user,
        String(conversationId),
      );
    } else {
      await dataSource.destroy();
      return res.status(400).json({ error: 'No conversation_id provided' });
    }
  } else {
    await dataSource.destroy();
    return res.status(400).json({ error: 'Method not supported' });
  }
};

const rdbmsCreateConversation = async (
  res: NextApiResponse,
  dataSource: DataSource,
  user: RDBMSUser,
  conversation: Conversation,
) => {
  const folderRepo = dataSource.getRepository(RDBMSFolder);
  const conversationRepo = dataSource.getRepository(RDBMSConversation);

  const rdbmsConversation = new RDBMSConversation();

  rdbmsConversation.user = user;
  rdbmsConversation.id = conversation.id;
  rdbmsConversation.name = conversation.name;
  rdbmsConversation.model_id = conversation.model.id;
  rdbmsConversation.prompt = conversation.prompt;
  rdbmsConversation.temperature = conversation.temperature;

  if (conversation.folderId !== null) {
    const updatedFolder = await folderRepo.findOneBy({
      id: conversation.folderId,
    });

    if (updatedFolder !== null) {
      rdbmsConversation.folder = updatedFolder;
    }
  } else {
    rdbmsConversation.folder = null;
  }

  await conversationRepo.save(rdbmsConversation);

  await dataSource.destroy();
  return res.status(200).json({
    OK: true,
  });
};

const rdbmsUpdateConversation = async (
  res: NextApiResponse,
  dataSource: DataSource,
  user: RDBMSUser,
  conversation: Conversation,
) => {
  const folderRepo = dataSource.getRepository(RDBMSFolder);
  const conversationRepo = dataSource.getRepository(RDBMSConversation);

  const rdbmsConversation = new RDBMSConversation();

  rdbmsConversation.user = user;
  rdbmsConversation.id = conversation.id;
  rdbmsConversation.name = conversation.name;
  rdbmsConversation.model_id = conversation.model.id;
  rdbmsConversation.prompt = conversation.prompt;
  rdbmsConversation.temperature = conversation.temperature;
  rdbmsConversation.is_public = conversation.is_public;

  if (conversation.folderId !== null) {
    const updatedFolder = await folderRepo.findOneBy({
      id: conversation.folderId,
    });

    if (updatedFolder !== null) {
      rdbmsConversation.folder = updatedFolder;
    }
  } else {
    rdbmsConversation.folder = null;
  }

  await conversationRepo.save(rdbmsConversation);

  await dataSource.destroy();
  return res.status(200).json({
    OK: true,
  });
};

const rdbmsDeleteConversation = async (
  res: NextApiResponse,
  dataSource: DataSource,
  user: RDBMSUser,
  conversationId: string,
) => {
  const conversationRepo = dataSource.getRepository(RDBMSConversation);
  const deletedConversation = await conversationRepo.findOneBy({
    user: { id: user.id },
    id: conversationId,
  });

  if (deletedConversation !== null) {
    await conversationRepo.remove(deletedConversation);
  }

  await dataSource.destroy();
  return res.status(200).json({
    OK: true,
  });
};

// DECKASSISTANT EDIT
const rdbmsGetConversation = async (
  res: NextApiResponse,
  dataSource: DataSource,
  user: RDBMSUser,
  conversationId: string,
) => {
  const conversationRepo = dataSource.getRepository(RDBMSConversation);
  const rdbmsConversation = await conversationRepo.findOneBy({
    user: { id: user.id },
    id: conversationId,
  });

  if(rdbmsConversation) {
    const model_id = rdbmsConversation.model_id as keyof typeof OpenAIModelID;

    const model = (OpenAIModels as any)[model_id];

    const messageRepo = dataSource.getRepository(RDBMSMessage);
    const rdbmsMessages = await messageRepo.find({
      where: {
        user: { id: user.id },
        conversation: { id: conversationId },
      },
      order: { timestamp: { direction: 'ASC' } },
    });

    const messages: Message[] = [];
    rdbmsMessages.forEach((rdbmsMessage) => {
      let message: Message = {
        id: rdbmsMessage.id,
        content: rdbmsMessage.content,
        role: rdbmsMessage.role as Role,
      };
      messages.push(message);
    });

    let folderId = null;
    if(rdbmsConversation.folder !== undefined) {
      console.log(rdbmsConversation.folder);
      if(rdbmsConversation.folder?.id !== undefined) {
        folderId = rdbmsConversation.folder.id;
      }
    }
    let conversation: Conversation = {
      id: rdbmsConversation.id,
      name: rdbmsConversation.name,
      model: model,
      messages: messages,
      folderId: folderId,
      prompt: rdbmsConversation.prompt,
      temperature: rdbmsConversation.temperature,
      is_public: rdbmsConversation.is_public,
      created_at: rdbmsConversation.created_at,
    };

    await dataSource.destroy();
    return res.status(200).json(conversation);
  }
  else {
    await dataSource.destroy();
    return res.status(404).json({ OK: false });
  }
};
// EDIT DECKASSISTANT EDIT

export default handler;
