import express, { json } from "express";
import bodyParser from "body-parser";
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

import indexRoute from './routes/index.js'
import telegramRoute from './routes/telegram.js'
import accountRoute from './routes/account.js'
import { webhookRouteLimit } from "./routes/webhookLimit.js";
import { webhookRouteMarket } from "./routes/webhookMarket.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

app.use(json({ limit: "2mb" }));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');



app.use("/", indexRoute);
app.post(`/${process.env.WEBHOOK_ENDPOINT}`,  process.env.TYPE_ORDER == 'LIMIT' ? webhookRouteLimit : webhookRouteMarket);
app.post("/authen", async function(req, res) {
  try {
      const request = req.body
      if (request.apiKey !== process.env.API_KEY) {
        res.status(401).json({ error: 'Unauthorized' })
      }
      else{
        res.status(200).json({ apiKey: request.apiKey })
      }
    }
    catch(error){
      console.log(error)
    }
})
app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, API-Key')
  next()
})
app.use((req, res, next) => {
  const apiKey = req.get('API-Key')
  if (!apiKey || apiKey !== process.env.API_KEY) {
    res.status(401).json({ error: 'Unauthorized' })
  } else {
    next()
  }
})



app.use("/telegram", telegramRoute)
app.use("/account", accountRoute)



// errors & edge cases
app.use((err, req, res, _) => {
  res.status(err.status || 500);
  res.json({
    err: {
      message: err.message,
    },
  });
});

app.use((req, res, next) => {
  const error = new Error("Route Not Found");
  error.message = "404";
  next(error);
  return res.status(404).send({
    message: "Route Not Found",
  });
});

export default app;
