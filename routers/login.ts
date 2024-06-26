import express from "express";
import { User } from "../interfaces";
import { ObjectId } from "mongodb";
import { login, usersCollection, decksCollection } from "../db";
import { starterDeck } from "../starterDeck";
import bcrypt from "bcrypt";
import { flashMiddleware } from "../fleshMiddleware";

export default function loginRouter() {
  const router = express.Router();
  router.use(flashMiddleware);
  const saltRounds = parseInt(process.env.SALTROUNDS!) || 10;

  router.get("/login", (req, res) => {
    return res.render("loginspage", {
      alert: false,
      alertType: "none",
      message: "",
    });
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
      return res.render("loginspage", {
        alert: "true",
        alertType: "error",
        message: e.message,
      });
    }
  });

  router.get("/register", (req, res) => {
    res.render("registerpage", {
      alert: false,
      alertType: "none",
      message: "",
    });
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
      return res.render("registerpage", {
        alert: true,
        alertType: "error",
        message: e.message,
      });
    }

    const existingUser = await usersCollection.findOne({
      email: registerEmail,
    });

    try {
      if (existingUser) {
        throw new Error("Account bestaat al, login");
      }
    } catch (e: any) {
      req.session.message = { type: "error", message: e.message };
      return res.render("loginspage", {
        alert: true,
        alertType: "error",
        message: e.message,
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
