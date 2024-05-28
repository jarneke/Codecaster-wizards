import express from "express";
import { secureMiddleware } from "../secureMiddleware";
import { decksCollection, usersCollection, login } from "../db";
import { Deck, User } from "../interfaces";
import bcrypt from "bcrypt";

export default function profileRouter() {
  const router = express.Router();
  const saltRounds = parseInt(process.env.SALTROUNDS!) || 10;
  router.get("/profile", secureMiddleware, async (req, res) => {
    let favoritedDecks: Deck[] = await decksCollection
      .find({ favorited: true, userId: res.locals.user._id })
      .toArray();

    res.render("profile", {
      // HEADER
      user: res.locals.user,
      // -- The names of the js files you want to load on the page.
      jsFiles: ["editProfile"],
      // -- The title of the page
      title: "Profile Page",
      toRedirectTo: "profile",
      // -- The Tab in the nav bar you want to have the orange color
      // -- (0 = home, 1 = decks nakijken, 2 = deck simuleren, all other values lead to no change in color)
      tabToColor: 4,
      favoriteDecks: favoritedDecks,
    });
  });
  router.post("/profile", secureMiddleware, async (req, res) => {
    const { firstName, lastName, email, passwordFormLabel, description } =
      req.body;
    const userName: string = `${firstName === "" ? res.locals.user?.firstName : firstName
      }_${lastName === "" ? res.locals.user?.lastName : lastName}`;

    const newUserDetails: User = {
      firstName:
        firstName === "" && res.locals.user
          ? res.locals.user.firstName
          : firstName,
      lastName:
        lastName === "" && res.locals.user
          ? res.locals.user?.lastName
          : lastName,
      userName:
        userName === "" && res.locals.user
          ? res.locals.user?.userName
          : userName,
      email: email === "" && res.locals.user ? res.locals.user?.email : email,
      description:
        description === "" && res.locals.user
          ? res.locals.user.description
          : description,
      password:
        passwordFormLabel === "" && res.locals.user
          ? res.locals.user.password
          : await bcrypt.hash(passwordFormLabel, saltRounds),
      role: "USER",
    };
    if (req.body.passwordFormLabel !== "") {
      await usersCollection.updateOne(
        { _id: res.locals.user?._id },
        { $set: newUserDetails }
      );
      let user: User | undefined = await login(
        newUserDetails.email,
        req.body.passwordFormLabel
      );
      delete user!.password;
      req.session.user = user;
      res.redirect("/profile");
    } else {
      // TODO: maak editFail pagina en editFail routes
      return res.redirect("/editFail");
    }
  });
  router.post("/delete", secureMiddleware, async (req, res) => {
    // delete all decks of user
    const deleteQuery = await decksCollection.deleteMany({ userId: res.locals.user._id })
    console.log(deleteQuery.acknowledged);

    console.log(deleteQuery.deletedCount);

    // delete User
    await usersCollection.deleteOne({ _id: res.locals.user._id });

    res.redirect("/");
  });
  return router;
}
