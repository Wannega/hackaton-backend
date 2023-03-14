const express = require('express');
var cors = require('cors');
const { chunk } = require('lodash');
const { Configuration, OpenAIApi } = require('openai');

require('dotenv').config();

const textPreset =
  'В указанном ниже текста найди ключевые слова и переведи их на английский. Выведи только английские слова через пробел:';

const app = express();
app.use(express.json());
app.use(cors({ credentials: true, origin: '*' }));
app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept'
  );
  next();
});

const port = 3000;

const configuration = new Configuration({
  organization: process.env.OPENAI_ORG,
  apiKey: process.env.OPENAI_API_TOKEN,
});
const openai = new OpenAIApi(configuration);

app.post('/', async (req, res) => {
  console.log(req.body);
  const message = req.body?.message;
  const numberOfImages = parseInt(req.body?.n) || 1;
  const style = req.body?.style;

  if (!message) {
    return res.status(500).send('Missing required field: message');
  }

  try {
    const chatResponse = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'user',
          content: `${textPreset} ${message}`,
        },
      ],
    });

    const imageResponse = await openai.createImage({
      prompt:
        'style ' +
        style +
        chatResponse.data.choices[0].message.content,
      n: numberOfImages,
      size: '256x256',
    });
    const coverResponse = await openai.createImage({
      prompt:
        'style ' +
        style +
        'book cover illustration 4k beautiful detailed realistic real details' +
        chatResponse.data.choices[0].message.content,
      n: 1,
      size: '256x256',
    });
    const wordsArr = message.split(' ');

    const wordsCount = wordsArr.length / numberOfImages;

    const splittedArr = chunk(wordsArr, Math.ceil(wordsCount));

    const response = imageResponse.data.data.map((item, index) => ({
      ...item,
      text: splittedArr[index]?.join(' ') ?? '',
    }));

    response.unshift({
      url: coverResponse.data.data[0].url,
      text: '',
    });

    return res.send(JSON.stringify(response));
  } catch (e) {
    return res.status(500).send(e.response?.data.error.message);
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
