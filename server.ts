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
/**
 * A function to get and set all tips
 */
async function getTips() {
  allTips = await tipsCollection.find({}).toArray();
}
// initialize express app
const app = express();

// initialize alltips array
let allTips: Tip[] = [];

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

app.get("/decks", secureMiddleware, async (req, res) => {
  let decksForPage: Deck[] = await getDecksOfUser(res);
  // params from route
  // Pagination
  let pageSize: number = 9;
  let pageData: PageData = handlePageClickEvent(req.query);

  let totalPages = getTotalPages(decksForPage.length, pageSize);

  res.render("decks", {
    // HEADER
    user: res.locals.user,
    // -- The names of the js files you want to load on the page.
    jsFiles: [],
    // -- The title of the page
    title: "Deck page",
    // -- The Tab in the nav bar you want to have the orange color
    // -- (0 = home, 1 = decks nakijken, 2 = deck simuleren, all other values lead to no change in color)
    tabToColor: 1,
    // The page it should redirect to after feedback form is submitted
    toRedirectTo: `decks`,
    // MAIN
    // -- pagination
    page: pageData.page,
    totalPages: totalPages,
    filterUrl: pageData.filterUrl,
    // -- cards
    decks: decksForPage,
  });
});
app.get("/noDeck", secureMiddleware, (req, res) => {
  res.render("noDeck", {
    // HEADER
    user: res.locals.user,
    // -- The names of the js files you want to load on the page.
    jsFiles: [],
    // -- The title of the page
    title: "! geen decks !",
    // -- The Tab in the nav bar you want to have the orange color
    // -- (0 = home, 1 = decks nakijken, 2 = deck simuleren, all other values lead to no change in color)
    tabToColor: 4,
    // The page it should redirect to after feedback form is submitted
    toRedirectTo: "noDeck",
  });
});
app.get("/decks/:deckName", secureMiddleware, async (req, res) => {
  // params from route
  let cardLookup = req.query.cardLookup;
  let sort = req.query.sort;
  let sortDirection = req.query.sortDirection;

  // IMPORANT: This isnt gonna work,  need to filter by userId too, else 2 people with same deckName will conflict
  const selectedDeck: Deck | null = await decksCollection.findOne({
    deckName: req.params.deckName,
  });
  if (!selectedDeck) {
    res.redirect("/404");
  }

  let amountMap = new Map<Card, number>();
  for (const card of selectedDeck!.cards) {
    const existingCard = Array.from(amountMap.keys()).find(
      (c) => c.multiverseid === card.multiverseid
    );
    if (existingCard) {
      amountMap.set(existingCard, amountMap.get(existingCard)! + 1);
    } else {
      amountMap.set(card, 1);
    }
  }
  // Pagination
  let pageSize: number = 6;
  let pageData: PageData = handlePageClickEvent(req.query);
  let totalPages = getTotalPages(amountMap.size, pageSize);
  let amountLandcards: number | undefined = undefined;

  let avgManaCost: number | undefined = undefined;

  if (selectedDeck!.cards !== undefined) {
    avgManaCost = getAvgManaCost(selectedDeck!.cards);
    amountLandcards = selectedDeck!.cards.filter((card) =>
      card.types.includes("Land")
    ).length;
    amountMap = getCardWAmauntForPage(amountMap, pageData.page, pageSize);
  }

  res.render("deckdetails", {
    // HEADER
    user: res.locals.user,
    // -- The names of the js files you want to load on the page.
    jsFiles: [],
    // -- The title of the page
    title: selectedDeck?.deckName,
    // -- The Tab in the nav bar you want to have the orange color
    // -- (0 = home, 1 = decks nakijken, 2 = deck simuleren, all other values lead to no change in color)
    tabToColor: 1,
    // The page it should redirect to after feedback form is submitted
    toRedirectTo: `deck/${selectedDeck!.deckName}`,
    // MAIN
    // -- filter system
    cardLookup: cardLookup,
    sort: sort,
    sortDirection: sortDirection,
    // -- pagination
    page: pageData.page,
    totalPages: totalPages,
    filterUrl: pageData.filterUrl,
    // -- cards
    cards: amountMap,
    selectedDeck: selectedDeck,
    tip: allTips[getRandomNumber(0, allTips.length - 1)],
    amountLandcards: amountLandcards,
    avgManaCost: avgManaCost,
  });
});
app.post("/changeDeckName", async (req, res) => {
  const name = req.body.deckNameInput;
  const oldName = req.body.oldDeckName;

  // IMPORANT: This isnt gonna work,  need to filter by userId too, else 2 people with same deckName will conflict
  const oldDeck = await decksCollection.findOne({ deckName: oldName });

  decksCollection.updateOne(
    { _id: oldDeck?._id },
    { $set: { deckName: name } }
  );

  res.redirect(`/editDeck/${name}`);
});

app.get("/editDeck/:deckName", secureMiddleware, async (req, res) => {
  // IMPORANT: This isnt gonna work,  need to filter by userId too, else 2 people with same deckName will conflict
  const selectedDeck: Deck | null = await decksCollection.findOne({
    deckName: req.params.deckName,
  });
  if (!selectedDeck) {
    return res.redirect("/404");
  }

  let amountMap = new Map<Card, number>();
  for (const card of selectedDeck!.cards) {
    const existingCard = Array.from(amountMap.keys()).find(
      (c) => c.multiverseid === card.multiverseid
    );
    if (existingCard) {
      amountMap.set(existingCard, amountMap.get(existingCard)! + 1);
    } else {
      amountMap.set(card, 1);
    }
  }

  // Pagination
  let pageSize: number = 6;
  let pageData: PageData = handlePageClickEvent(req.query);
  let sorted: [Card, number][] = Array.from(amountMap).sort((a, b) => {
    return a[0].name.localeCompare(b[0].name);
  });
  let sortedAmountMap = new Map();

  sorted.forEach(([card, number]) => {
    sortedAmountMap.set(card, number);
  });
  let totalPages = getTotalPages(sortedAmountMap.size, pageSize);

  sortedAmountMap = getCardWAmauntForPage(
    sortedAmountMap,
    pageData.page,
    pageSize
  );

  res.render("editDeck", {
    // HEADER
    user: res.locals.user,
    // -- The names of the js files you want to load on the page.
    jsFiles: [],
    // -- The title of the page
    title: "Edit page",
    // -- The Tab in the nav bar you want to have the orange color
    // -- (0 = home, 1 = decks nakijken, 2 = deck simuleren, all other values lead to no change in color)
    tabToColor: 1,
    // The page it should redirect to after feedback form is submitted
    toRedirectTo: `editDeck/${selectedDeck!.deckName}`,
    // MAIN
    // -- pagination
    page: pageData?.page,
    totalPages: totalPages,
    filterUrl: pageData?.filterUrl,
    // -- cards
    cards: sortedAmountMap,
    selectedDeck: selectedDeck,
  });
});
app.post(
  "/removeCardFromDeck/:deckName/:_id/:page",
  secureMiddleware,
  async (req, res) => {
    const selectedDeck: Deck | null = await decksCollection.findOne({
      deckName: req.params.deckName,
      userId: res.locals.user._id,
    });
    if (!selectedDeck) {
      return res.redirect("/404");
    }
    // Remove a card from the deck based on the card's _id
    await decksCollection.updateOne(
      selectedDeck, // The filter to identify the selected deck
      [
        {
          $set: {
            cards: {
              $let: {
                // Define variables for the let expression
                vars: {
                  // Find the index of the card to be removed by its _id
                  index: {
                    $indexOfArray: ["$cards._id", new ObjectId(req.params._id)],
                  },
                },
                // Use the found index to create the new cards array without the specified card
                in: {
                  $concatArrays: [
                    // Include all cards before the one to be removed
                    { $slice: ["$cards", 0, { $add: ["$$index", 0] }] },
                    // Include all cards after the one to be removed
                    {
                      $slice: [
                        "$cards",
                        { $add: ["$$index", 1] },
                        { $size: "$cards" },
                      ],
                    },
                  ],
                },
              },
            },
          },
        },
      ]
    );

    res.redirect(`/editDeck/${req.params.deckName}?&page=${req.params.page}`);
  }
);
app.post(
  "/addCardTooDeck/:deckName/:_id/:page",
  secureMiddleware,
  async (req, res) => {
    const selectedDeck: Deck | null = await decksCollection.findOne({
      deckName: req.params.deckName,
      userId: res.locals.user._id,
    });
    if (!selectedDeck) {
      return res.redirect("/404");
    }

    let cardTooAdd: Card | null = await cardsCollection.findOne({
      _id: new ObjectId(req.params._id),
    });
    if (!cardTooAdd) {
      return res.redirect("/404");
    }
    if (selectedDeck.cards.length < 60) {
      if (!cardTooAdd!.types.find((e) => e == "Land")) {
        if (
          selectedDeck.cards.filter((e) => e.name == cardTooAdd!.name).length <
          4
        ) {
          await decksCollection.updateOne(selectedDeck, {
            $push: { cards: cardTooAdd! },
          });
        } else {
          console.log("4 or more cards");
        }
      } else {
        console.log("Is land card");
        await decksCollection.updateOne(selectedDeck, {
          $push: { cards: cardTooAdd! },
        });
      }
    } else {
      console.log("Deck full");

      // handle alert
    }

    res.redirect(`/editDeck/${req.params.deckName}?&page=${req.params.page}`);
  }
);
app.get("/makeDeck", secureMiddleware, (req, res) => {
  const deck: Deck = {
    userId: res.locals.user._id,
    deckName: req.body.deckName,
    cards: [],
    deckImageUrl: req.body.hiddenImgUrl
      ? req.body.hiddenImgUrl
      : "/assets/images/decks/1.webp",
    favorited: false,
  };
  res.render("makeDeck", {
    // HEADER
    user: res.locals.user,
    // -- The names of the js files you want to load on the page.
    jsFiles: ["changeDeckImage"],
    // -- The title of the page
    title: "makeDeck",
    // -- The Tab in the nav bar you want to have the orange color
    // -- (0 = home, 1 = decks nakijken, 2 = deck simuleren, all other values lead to no change in color)
    tabToColor: 1,
    // The page it should redirect to after feedback form is submitted
    toRedirectTo: "makeDeck",
    // makeDeck form
    deckName: deck.deckName,
    deckImage: deck.deckImageUrl,
  });
});
app.post("/deleteDeck", secureMiddleware, async (req, res) => {
  let deckName = req.body.deckName;

  await decksCollection.deleteOne({ deckName: deckName });

  res.redirect("/decks");
});
app.post("/makeDeck", secureMiddleware, async (req, res) => {
  let newDeck: Deck = {
    userId: res.locals.user._id,
    deckName: req.body.deckName,
    cards: [],
    deckImageUrl:
      req.body.imgUrl !== "" ? req.body.imgUrl : "/assets/images/decks/1.webp",
    favorited: false,
  };

  await decksCollection.insertOne(newDeck);

  res.redirect("/decks");
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
app.all("*", (req, res) => {
  // and redirect to 404 not found.
  res.redirect("/404");
});
app.listen(app.get("port"), async () => {
  console.clear();
  console.log("[ - SERVER - ]=> connecting to database");
  await connect();
  console.log("[ - SERVER - ]=> getting tips");
  await getTips();
  console.log("[ - SERVER - ]=> ! DONE !");
  console.log(
    "[ - SERVER - ]=> Listening at http://localhost:" + app.get("port")
  );
});
