import session, { MemoryStore } from "express-session";
import mongoDbSession from "connect-mongodb-session";
import { FlashMessage, User } from "./interfaces";
import dotenv from "dotenv";

dotenv.config();

const MongoDbStore = mongoDbSession(session);

const mongoStore = new MongoDbStore({
  uri: process.env.MONGO_URI || "mongodb://localhost:27017",
  collection: "sessions",
  databaseName: "Codecaster",
});

declare module "express-session" {
  export interface SessionData {
    user?: User,
    message?: FlashMessage
  }
}

mongoStore.on("error", (error) => {
  console.error(error);
});

export default session({
  secret: process.env.SESSION_SECRET ?? "my-super-secret-secret",
  store: mongoStore,
  resave: true,
  saveUninitialized: true,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
  },
});
