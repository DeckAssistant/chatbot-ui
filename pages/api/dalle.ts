import { NextApiRequest, NextApiResponse } from 'next';

const fs = require('fs');
const path = require('path');
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
var randomstring = require('randomstring');

import { OpenAIError } from '@/utils/server';
import OpenAI from 'openai';

import { ChatBody } from '@/types/chat';

import { extname } from 'path';
import { writeFileSync } from 'fs';

async function storeFileLocally(url: string): Promise<string> {
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    const data = Buffer.from(buffer);

    const path = `/tmp/${randomstring.generate(20)}.${getUrlFileExtension(url)}`;

    writeFileSync(path, data);

    return path;
}

const getUrlFileExtension = (url: string) => {
  const u = new URL(url);
  const ext = u.pathname.split(".").pop();
  if(!ext) {
    return "";
  }
  return ext === "/" ? undefined : ext.toLowerCase()
}

function getFileExtension(url: string): string {
  // Extension starts after the first dot after the last slash
  var extStart = url.indexOf('.', url.lastIndexOf('/') + 1);
  if (extStart == -1) {
    return '';
  }
  var ext = url.substring(extStart + 1);
  // end of extension must be one of: end-of-string or question-mark or hash-mark
  var extEnd = ext.search(/$|[?#]/);
  return ext.substring (0, extEnd);
}

const dalleImageGeneration = async (
  prompt: string,
) => {
  const openai = new OpenAI({apiKey: process.env.OPENAI_API_KEY});

  let dalleInput = {
    prompt: prompt,
    model: `dall-e-3`,
    size: `1024x1024` as const,
    response_format: `url` as const,
  };

  console.log('Generating image with prompt:', prompt);

  const image = await openai.images.generate(dalleInput).catch((err) => {
    if (err instanceof OpenAI.APIError) {
      console.log('API error:', err.message);
      throw err;
    } else {
      throw err;
    }
  });

  console.log('Result of DALL-E API', image);

  if(!image) {
    return undefined;
  }

  const s3 = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.OPENAI_API_KEY}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: `${process.env.CLOUDFLARE_ACCESS_KEY}`,
      secretAccessKey: `${process.env.CLOUDFLARE_SECRET_ACCESS_KEY}`,
    },
  });


  let response = '';
  for(let i = 0; i < image.data.length; i++) {
    const responseData = image.data[i];
    let imageURL = responseData.url;

    if(!imageURL) { continue; }

    // Download the image
    const tmpFilePath = await storeFileLocally(imageURL);
    console.log('Downloaded temporary file:', tmpFilePath);
    const timestamp = Date.now();
    const imageFormat = getFileExtension(tmpFilePath);

    // Upload the file to AWS S3 bucket
    const uploadParams = {
      Bucket: 'deckassistant-dalle-images',
      Key: `images/${timestamp}.${imageFormat}`,
      Body: fs.createReadStream(tmpFilePath),
    };

    //await s3.upload(uploadParams).promise();
    //PutObjectCommand({Bucket: 'my-bucket-name', Key: 'dog.png'})
    const command = new PutObjectCommand(uploadParams);

    try {
      const response = await s3.send(command);
      console.log(response);
    } catch (err) {
      console.error(err);
    }

    // Remove the temporary file
    fs.unlinkSync(tmpFilePath);
    console.log('Deleted temporary file:', tmpFilePath);

    // Retrieve the uploaded file URL
    const uploadedImageURL = `https://images.r2.deckassistant.io/${uploadParams.Key}`;

    // Add the uploaded image URL to the response
    //response += `${responseData.revised_prompt}\n\n[![${uploadedImageURL}](${uploadedImageURL})](${uploadedImageURL})\n\n`;
    response += '```[DALLE](' + uploadedImageURL + ':' + responseData.revised_prompt + ')```';
    console.log('Response:', response);
  }

  return response;
};


const handler = async (req: NextApiRequest, res: NextApiResponse<any>) => {
  try {
    const { messages } = req.body as ChatBody;

    const imagePrompt = messages[messages.length - 1].content.trim();
    console.log('imagePrompt:', imagePrompt);

    const result = await dalleImageGeneration(imagePrompt);

    res.status(200).json({ answer: result });
  } catch (error) {
    console.error(error);
    if (error instanceof OpenAIError) {
      console.error(error);
      res.status(500).json({ error });
    } else {
      res.status(500).json({ error: 'Error' });
    }
  }
};

export default handler;
