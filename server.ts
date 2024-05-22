import express, {NextFunction, Router} from "express";
import ejs from "ejs";
import {
  Tip,
  Deck,
  Card,
  User,
  Feedback,
  PageData,
  Filter,
  filterTypes,
  filterRarities,
} from "./interfaces";
import Magic = require("mtgsdk-ts");
import {
  getDecksOfUser,
  handlePageClickEvent,
  getCardsForPage,
  getTotalPages,
  getAvgManaCost,
  getCardWAmauntForPage,
  getRandomNumber,
  shuffleCards,
  getChance,
  filterAndSortCards,
} from "./functions";
import {
  tipsCollection,
  login,
  usersCollection,
  feedbacksCollection,
  decksCollection,
  cardsCollection,
  connect,
} from "./db";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import session from "./session";
import { secureMiddleware } from "./secureMiddleware";
import bcrypt from "bcrypt";
import { ObjectId } from "mongodb";
import { starterDeck } from "./starterDeck";
import feedbackRouter from "./routers/feedback"
import homeRouter from "./routers/home";
import drawtestRouter from "./routers/drawtest";
import deckRouter from "./routers/decks";

// initialize express app
const app = express();

const saltRounds = parseInt(process.env.SALTROUNDS!) || 10;



// set the port to use on the port specified in .env, or default to 3000
app.set("port", process.env.PORT ?? 3000);
// set the viewengine to ejs
app.set("view engine", "ejs");

// tell app that static files ae in public map
app.use(express.static("public"));
// tell app to use bodyParser
app.use(bodyParser.urlencoded({ extended: true }));
// tell app to use cookieParser
app.use(cookieParser());
app.use(session);

async function setupDecksRouter(){
  let router = await deckRouter()
  app.use(router)
}

app.use("/feedback", feedbackRouter());
app.use("/home", homeRouter());
app.use("/drawtest", drawtestRouter());
setupDecksRouter().catch(err => console.log(err))

// landingspage
app.get("/", (req, res) => {
  res.render("landingspage");
});
app.post("/favorite/:deckName", secureMiddleware, async (req, res) => {
  // IMPORANT: This isnt gonna work,  need to filter by userId too, else 2 people with same deckName will conflict
  const selectedDeck: Deck | null = await decksCollection.findOne({
    deckName: req.params.deckName,
  });
  if (!selectedDeck) {
    return res.redirect("/404");
  }
  if (selectedDeck.favorited) {
    await decksCollection.updateOne(selectedDeck, {
      $set: { favorited: false },
    });
  } else {
    await decksCollection.updateOne(selectedDeck, {
      $set: { favorited: true },
    });
  }

  res.redirect(`/${req.body.favToRedirect}`);
});
app.get("/login", (req, res) => {
  return res.render("loginspage", {
    alert: false,
    alertMsg: "",
  });
});
app.post("/login", async (req, res) => {
  const { loginEmail, loginPassword } = req.body;

  try {
    let user: User | undefined = await login(loginEmail, loginPassword);
    delete user!.password;

    req.session.user = user;
    res.redirect("/home");
  } catch (e: any) {
    return res.render("loginspage", {
      alert: true,
      alertMsg: "E-mail of wachtwoord is onjuist!",
    });
  }
});
app.get("/register", (req, res) => {
  res.render("registerpage");
});
app.post("/register", async (req, res) => {
  const {
    registerFName,
    registerName,
    registerUsername,
    registerEmail,
    registerPassword,
    registerConfirmPassword,
  } = req.body;

  if (registerConfirmPassword !== registerPassword) {
    return res.render("registerpage", {
      alert: true,
      alertMsg: "wachtwoorden komen niet overeen",
    });
  }

  const existingUser = await usersCollection.findOne({ email: registerEmail });
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
    favorited: true
  })

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
app.post("/logout", async (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
});
app.get("/profile", secureMiddleware, async (req, res) => {
  // IMPORANT: This isnt gonna work,  need to filter by userId too, else 2 people with same deckName will conflict
  let allDecks: Deck[] = await decksCollection.find().toArray();
  let favoritedDecks: Deck[] = allDecks.filter((e) => e.favorited);

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
app.post("/profile", secureMiddleware, async (req, res) => {
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
      lastName === "" && res.locals.user ? res.locals.user?.lastName : lastName,
    userName:
      userName === "" && res.locals.user ? res.locals.user?.userName : userName,
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
});
app.post("/delete", secureMiddleware, async (req, res) => {
  await usersCollection.deleteOne({ _id: res.locals.user?._id });
  res.redirect("/");
});
app.get("/404", secureMiddleware, (req, res) => {
  res.render("404", {
    // HEADER
    user: res.locals.user,
    // -- The names of the js files you want to load on the page.
    jsFiles: [],
    // -- The title of the page
    title: "! 404 - niet gevonden !",
    // -- The Tab in the nav bar you want to have the orange color
    // -- (0 = home, 1 = decks nakijken, 2 = deck simuleren, all other values lead to no change in color)
    tabToColor: 4,
    // The page it should redirect to after feedback form is submitted
    toRedirectTo: "404",
  });
});
//catch all paths that dont already exist.
// app.all("*", (req, res) => {
//   // and redirect to 404 not found.
//   res.redirect("/404");
// });
app.listen(app.get("port"), async () => {
  console.clear();
  console.log("[ - SERVER - ]=> connecting to database");
  await connect();
  console.log("[ - SERVER - ]=> ! DONE !");
  console.log(
    "[ - SERVER - ]=> Listening at http://localhost:" + app.get("port")
  );
});
