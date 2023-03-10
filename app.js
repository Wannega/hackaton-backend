const express = require("express");
const { Configuration, OpenAIApi } = require("openai");

require("dotenv").config();

const textPreset =
  "В указанном ниже текста найди ключевые слова и переведи их на английский. Выведи только английские слова через пробел:";

const app = express();
app.use(express.json());

const port = 3000;

const configuration = new Configuration({
  organization: process.env.OPENAI_ORG,
  apiKey: process.env.OPENAI_API_TOKEN,
});
const openai = new OpenAIApi(configuration);

app.get("/", async (req, res) => {
  const message = req.body?.message;
  const numberOfImages = req.body?.n ?? 1;

  if (!message) {
    return res.status(500).send("Missing required field: message");
  }

  try {
    const chatResponse = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: `${textPreset} ${message}`,
        },
      ],
    });

    const imageResponse = await openai.createImage({
      prompt: chatResponse.data.choices[0].message.content,
      n: numberOfImages,
    });
    return res.send(JSON.stringify(imageResponse.data));
  } catch(e) {
    return res.status(500).send(e.response.data.error.message);
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
