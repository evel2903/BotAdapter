import express, { json } from "express";
import bodyParser from "body-parser";
import { handleWebhook } from "./handleWebhook.js";
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

import indexRoute from './routes/index.js'
import telegramRoute from './routes/telegram.js'
import accountRoute from './routes/account.js'

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

app.use("/telegram", telegramRoute)
app.use("/account", accountRoute)

app.post("/webhook", handleWebhook);

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
