import express from "express";
import { User } from "../interfaces";
import { ObjectId } from "mongodb";
import { login, usersCollection, decksCollection } from "../db";
import { starterDeck } from "../starterDeck";
import bcrypt from "bcrypt";
import { appendFile } from "fs";
import { flashMiddleware } from "../fleshMiddleware";
import e from "express";
import { error } from "console";

export default function loginRouter() {
  const router = express.Router();
  router.use(flashMiddleware);
  const saltRounds = parseInt(process.env.SALTROUNDS!) || 10;

  router.get("/login", (req, res) => {
    return res.render("loginspage");
  });
  router.post("/login", async (req, res) => {
    const { loginEmail, loginPassword } = req.body;

    try {
      let user: User | undefined = await login(loginEmail, loginPassword);
      delete user!.password;

      req.session.user = user;
      res.redirect("/home");
    } catch (e: any) {
      req.session.message = { type: "error", message: e.message };
      return res.redirect("/login");
    }
  });
  router.get("/register", (req, res) => {
    res.render("registerpage");
  });
  router.post("/register", async (req, res) => {
    const {
      registerFName,
      registerName,
      registerUsername,
      registerEmail,
      registerPassword,
      registerConfirmPassword,
    } = req.body;

    try {
      if (registerConfirmPassword !== registerPassword) {
        throw new Error("Wachtwoorden komen niet overeen");
      }
    } catch (e: any) {
      req.session.message = { type: "error", message: e.message };
      return res.redirect("/register");
    }

    const existingUser = await usersCollection.findOne({
      email: registerEmail,
    });
    if (existingUser) {
      return res.render("registerpage", {
        alert: true,
        alertMsg: "E-mail bestaat al",
      });
    }

    const newUser: User = {
      _id: new ObjectId(),
      firstName: registerFName,
      lastName: registerName,
      userName: registerUsername,
      email: registerEmail,
      description: "Geen beschrijving",
      password: await bcrypt.hash(registerPassword, saltRounds),
      role: "USER",
    };
    await usersCollection.insertOne(newUser);
    // make starterdeck
    await decksCollection.insertOne({
      _id: new ObjectId(),
      userId: newUser._id!,
      deckName: starterDeck.deckName,
      cards: starterDeck.cards,
      deckImageUrl: starterDeck.deckImageUrl,
      favorited: true,
    });

    try {
      let user: User | undefined = await login(registerEmail, registerPassword);
      delete user!.password;
      req.session.user = user;
      res.redirect("/home");
    } catch (e: any) {
      return res.render("loginspage", {
        alert: true,
        alertMsg: "Fout bij het aanmelden, probeer opnieuw.",
      });
    }
  });
  router.post("/logout", async (req, res) => {
    req.session.destroy(() => {
      res.redirect("/login");
    });
  });
  return router;
}
