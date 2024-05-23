import express from "express";
import { Tip, Deck, Card, PageData } from "./interfaces";
import {
  getDecksOfUser,
  handlePageClickEvent,
  getTotalPages,
  getAvgManaCost,
  getCardWAmauntForPage,
  getRandomNumber,
} from "./functions";
import {
  tipsCollection,
  decksCollection,
  cardsCollection,
  connect,
} from "./db";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import session from "./session";
import { secureMiddleware } from "./secureMiddleware";
import { ObjectId } from "mongodb";
import feedbackRouter from "./routers/feedback";
import homeRouter from "./routers/home";
import drawtestRouter from "./routers/drawtest";
import loginRouter from "./routers/login";
import profileRouter from "./routers/profile";
import deckRouter from "./routers/decks";

// initialize express app
const app = express();

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

app.use("/feedback", feedbackRouter());
app.use("/home", homeRouter());
app.use("/drawtest", drawtestRouter());
app.use(deckRouter())
app.use(loginRouter());
app.use(profileRouter());

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
