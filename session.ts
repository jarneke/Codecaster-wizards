import session, { MemoryStore } from "express-session";
import * as i from "./interfaces";
import mongoDbSession from "connect-mongodb-session";

const MongoDbStore = mongoDbSession(session);

const mongoStore = new MongoDbStore({
  uri: process.env.MONGO_URI || "mongodb://localhost:27017",
  collection: "sessions",
  databaseName: "Codecaster",
});

declare module "express-session" {
  export interface SessionData {
    user?: i.User;
  }
}

export default session({
  secret: process.env.SESSION_SECRET ?? "my-super-secret-secret",
  store: mongoStore,
  resave: true,
  saveUninitialized: true,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
  },
});
