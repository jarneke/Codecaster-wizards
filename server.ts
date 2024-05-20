import express from "express";
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
/**
 * A function to get and set all tips
 */
async function getTips() {
  allTips = await tipsCollection.find({}).toArray();
}
// initialize express app
const app = express();

const saltRounds = parseInt(process.env.SALTROUNDS!) || 10;

// initialize alltips array
let allTips: Tip[] = [];

// variable to store last selected deck on drawtest page
let lastSelectedDeck: Deck;
// variable to store selected deck
let selectedDeck: Deck | null = null;
// variable to store unpulled cards of drawtest page
let unpulledCards: Card[] = [];
// variable to store pulled cards of drawtest page
let pulledCards: Card[] = [];

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
app.post("/dontShowPopup", async (req, res) => {
  // set a cookie that lasts a week
  res.cookie("dontShowInfo", "true", {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
  });
  // redirect to home page after setting cookie
  res.redirect("/home");
});
app.get("/feedback", secureMiddleware, async (req, res) => {
  // if non admin goes to this route redirect to /home
  if (res.locals.user.role !== "ADMIN") {
    return res.redirect("/home")
  }

  res.render("feedback", {
    // HEADER
    user: res.locals.user,
    // -- The names of the js files you want to load on the page.
    jsFiles: [],
    // -- The title of the page
    title: "feedback",
    // -- The Tab in the nav bar you want to have the orange color
    // -- (0 = home, 1 = decks nakijken, 2 = deck simuleren, all other values lead to no change in color)
    tabToColor: 3,
    // The page it should redirect to after feedback form is submitted
    toRedirectTo: "feedback",
    allFeedback: await feedbacksCollection.find().toArray(),
  })
})
app.post("/feedback", secureMiddleware, async (req, res) => {
  // params from route
  const feedbackType = req.body.feedbackType;
  const feedback = req.body.feedback;
  const redirectPage = req.body.toRedirectTo;

  // make a feedback object
  const feedBackItem: Feedback = {
    user: res.locals.user,
    feedbackType: feedbackType,
    feedback: feedback,
    date: new Date()
  };

  // insert it in database
  await feedbacksCollection.insertOne(feedBackItem);
  // redirect to specified page
  res.redirect(`/${redirectPage}`);
});
app.post("/feedback/delete/:feedbackId", secureMiddleware, async (req, res) => {
  const feedbackId: ObjectId = new ObjectId(req.params.feedbackId);
  await feedbacksCollection.deleteOne({ _id: feedbackId })
  res.redirect("/feedback")
})
app.get("/home", secureMiddleware, async (req, res) => {
  // get all the decks of a user
  const allDecks: Deck[] = await getDecksOfUser(res);
  // store all the deckNames
  const deckNames: string[] = allDecks.map((e) => e.deckName);
  // params from route
  // -- filter and sort
  let cardLookup = req.query.cardLookup;
  let filterType = req.query.filterType;
  let filterRarity = req.query.filterRarity;
  let whiteManaChecked = req.query.whiteManaChecked;
  let blueManaChecked = req.query.blueManaChecked;
  let blackManaChecked = req.query.blackManaChecked;
  let greenManaChecked = req.query.greenManaChecked;
  let redManaChecked = req.query.redManaChecked;
  let colorlessManaChecked = req.query.colorlessManaChecked;
  let sort = req.query.sort;
  let sortDirection = req.query.sortDirection;

  // Pagination
  // -- Set pageSize
  let pageSize: number = 12;
  // -- Get page and filterUrl
  let pageData: PageData = handlePageClickEvent(req.query);

  // -- set filterparams for cards to load
  const filterParam: Filter = {
    cardLookup: cardLookup,
    filterType: filterType,
    filterRarity: filterRarity,
    whiteManaChecked: whiteManaChecked,
    blueManaChecked: blueManaChecked,
    blackManaChecked: blackManaChecked,
    greenManaChecked: greenManaChecked,
    redManaChecked: redManaChecked,
    colorlessManaChecked: colorlessManaChecked,
    sort: sort,
    sortDirection: sortDirection,
  };
  // get cardsToLoad and totalpages
  let cardsToLoadAndTotalPages = await getCardsForPage(
    filterParam,
    pageData.page,
    pageSize
  );
  // Render
  res.render("home", {
    // HEADER
    user: res.locals.user,
    // -- The names of the js files you want to load on the page.
    jsFiles: ["infoPopUp", "manaCheckbox", "tooltips", "cardsModal"],
    // -- The title of the page
    title: "Home page",
    // -- The Tab in the nav bar you want to have the orange color
    // -- (0 = home, 1 = decks nakijken, 2 = deck simuleren, all other values lead to no change in color)
    tabToColor: 0,
    // The page it should redirect to after feedback form is submitted
    toRedirectTo: "home",
    // MAIN
    // -- modal
    dontShowModal: req.cookies.dontShowInfo === "true" ? true : false,
    // -- filter system
    cardLookup: cardLookup,
    type: filterType,
    types: filterTypes,
    rarity: filterRarity,
    rarities: filterRarities,
    whiteManaChecked: whiteManaChecked == undefined ? "true" : whiteManaChecked,
    blueManaChecked: blueManaChecked == undefined ? "true" : blueManaChecked,
    blackManaChecked: blackManaChecked == undefined ? "true" : blackManaChecked,
    greenManaChecked: greenManaChecked == undefined ? "true" : greenManaChecked,
    redManaChecked: redManaChecked == undefined ? "true" : redManaChecked,
    colorlessManaChecked:
      colorlessManaChecked == undefined ? "true" : colorlessManaChecked,
    sort: sort,
    sortDirection: sortDirection,
    pageLink: "home",
    // -- pagination
    page: pageData.page,
    totalPages: cardsToLoadAndTotalPages.totalPages,
    filterUrl: pageData.filterUrl,
    deck: "",
    // -- cards
    cards: cardsToLoadAndTotalPages.cards,
    // cardModal
    allDeckName: deckNames,
  });
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
app.get("/drawtest", secureMiddleware, async (req, res) => {
  // Query params
  // -- filter and sort
  let cardLookup = req.query.cardLookup;
  let filterType = req.query.filterType;
  let filterRarity = req.query.filterRarity;
  let whiteManaChecked = req.query.whiteManaChecked;
  let blueManaChecked = req.query.blueManaChecked;
  let blackManaChecked = req.query.blackManaChecked;
  let greenManaChecked = req.query.greenManaChecked;
  let redManaChecked = req.query.redManaChecked;
  let colorlessManaChecked = req.query.colorlessManaChecked;
  let sort = req.query.sort;
  let sortDirection = req.query.sortDirection;
  let deck = req.query.decks;
  let cardLookupInDeck = req.query.cardLookupInDeck;
  let cardLookupInDeckInput = req.query.cardLookupInDeckInput;

  // -- other
  let whatToDo = req.query.action;
  let selectedDeckQuery = req.query.decks;

  let cardLookupInDeckCard: Card | undefined = undefined;
  let cardLookupInDeckCardChance: number | undefined = undefined;
  // Logic

  // Find What Deck is selected
  // -- if selectedDeckQuery is defined, look in deckscollection for this deck
  if (selectedDeckQuery) {
    selectedDeck = await decksCollection.findOne({
      deckName: `${selectedDeckQuery}`,
      userId: res.locals.user._id
    });
    // if this is not found, render 404 not found page
    if (!selectedDeck) {
      return res.redirect("/404")
    }
    // -- if selectedDeckQuery is undefined
  } else {
    // -- and lastSelectedDeck is undefined
    if (!lastSelectedDeck) {
      // -- find the first deck in the deckscollection
      selectedDeck = await decksCollection.findOne({ userId: res.locals.user._id });
      // if not found => no decks in database, so redirect to /noDeck
      if (!selectedDeck) return res.redirect("/noDeck");
      // -- if lastSelectedDeck is defined, set selectedDeck to lastSelectedDeck
    } else {
      selectedDeck = lastSelectedDeck
    }
  }
  // if deck is diffrent from last load
  if (lastSelectedDeck?.deckName !== selectedDeck.deckName) {
    // set unpulledCards to cards of new deck and shuffle them
    unpulledCards = [...shuffleCards(selectedDeck.cards)];
    // clear pulledCards
    pulledCards = [];
  } else {
    // pull and reset logic
    // -- if pull is asked
    if (whatToDo === "pull") {
      // -- get last card of unpulledCards
      let card = unpulledCards.pop()
      // -- if this card is found
      if (card !== undefined) {
        // -- add this card to the front of pulledCards
        pulledCards.unshift(card)
      }
      // -- id reset is asked
    } else if (whatToDo === "reset") {
      // reset unpulledCards and shuffle them
      unpulledCards = [...shuffleCards(selectedDeck.cards)];
      // reset pulledCards
      pulledCards = [];
    }
    // CardLookup Logic

    if (cardLookupInDeck !== "" && cardLookupInDeck) {
      // find the card they are looking for
      cardLookupInDeckCard = selectedDeck.cards.find((e) =>
        e.name.toLowerCase().includes(`${cardLookupInDeck}`.toLowerCase())
      );
      // if not found, redirect to 404
      if (!cardLookupInDeckCard) {
        return res.redirect("/404")
      }
      // calculate the chance u have to pull that card from the unpulledCards
      cardLookupInDeckCardChance = getChance(
        unpulledCards,
        cardLookupInDeckCard
      ).chance;
    }
  }
  // Filter logic
  // -- initialize array
  let filterAndSortedCards: Card[] = [];

  // if length is 0 skip cause unneeded
  if (pulledCards.length !== 0) {
    filterAndSortedCards = [
      ...filterAndSortCards(
        pulledCards,
        cardLookup,
        filterType,
        filterRarity,
        whiteManaChecked,
        blueManaChecked,
        blackManaChecked,
        greenManaChecked,
        redManaChecked,
        colorlessManaChecked,
        sort,
        sortDirection
      ),
    ];
  }

  // Map cards so we filter out duplicates and keep count of how many of them are duplicate
  // -- initialize map
  let amountMap = new Map<Card, number>();
  // -- if length is 0 skip cause unneeded
  if (filterAndSortedCards.length !== 0) {

  }
  // -- loop over array
  for (const card of filterAndSortedCards) {
    // -- if card already exists in map or undefined if not
    const existingCard: Card | undefined = Array.from(amountMap.keys()).find(
      (c) => c.name === card.name
    );
    // -- if card exists in map
    if (existingCard) {
      // -- increase the count of the existing card
      amountMap.set(existingCard, amountMap.get(existingCard)! + 1);
      // -- if not
    } else {
      // -- add card to map and set count to 1
      amountMap.set(card, 1);
    }
  }

  // get the cardToShow (always the first card in pulledCards)
  let cardToShow: Card = pulledCards[0];
  // initialize nextCard
  let nextCard: Card | undefined = undefined;
  // if there is still a card in unpulled cards
  if (unpulledCards.length !== 0) {
    // set nextCard to the last index of unpulledCards
    nextCard = unpulledCards[unpulledCards.length - 1];
  }
  // calculate the chanceData of the cardToShow
  let chanceData = getChance(selectedDeck.cards, cardToShow);
  // save selectedDeck to be used next load of page
  lastSelectedDeck = selectedDeck;
  // Pagination
  let pageSize: number = 6;
  let pageData: PageData = handlePageClickEvent(req.query);
  let totalPages = getTotalPages(Array.from(amountMap.keys()).length, pageSize);
  amountMap = getCardWAmauntForPage(amountMap, pageData.page, pageSize);
  const allDecks: Deck[] = await getDecksOfUser(res);
  const allDeckNames: string[] = allDecks.map(e => e.deckName)

  res.render("drawtest", {
    // HEADER
    user: res.locals.user,
    // -- The names of the js files you want to load on the page.
    jsFiles: [
      "submitOnChange",
      "cardsModal",
      "manaCheckbox",
      "tooltips",
      "drawCard",
    ],
    // -- The title of the page
    title: "Deck simuleren",
    // -- The Tab in the nav bar you want to have the orange color
    // -- (0 = home, 1 = decks nakijken, 2 = deck simuleren, all other values lead to no change in color)
    tabToColor: 2,
    // The page it should redirect to after feedback form is submitted
    toRedirectTo: "drawtest",
    // MAIN
    // -- filter system
    cardLookup: cardLookup,
    type: filterType,
    types: filterTypes,
    rarity: filterRarity,
    rarities: filterRarities,
    whiteManaChecked: whiteManaChecked == undefined ? "true" : whiteManaChecked,
    blueManaChecked: blueManaChecked == undefined ? "true" : blueManaChecked,
    blackManaChecked: blackManaChecked == undefined ? "true" : blackManaChecked,
    greenManaChecked: greenManaChecked == undefined ? "true" : greenManaChecked,
    redManaChecked: redManaChecked == undefined ? "true" : redManaChecked,
    colorlessManaChecked:
      colorlessManaChecked == undefined ? "true" : colorlessManaChecked,
    sort: sort,
    sortDirection: sortDirection,
    deck: deck,
    pageLink: "drawtest",
    // -- pagination
    page: pageData.page,
    totalPages: totalPages,
    filterUrl: pageData.filterUrl,
    // -- cardlookupInDeck
    cardLookupInDeck: cardLookupInDeck,
    cardLookupInDeckInput: cardLookupInDeckInput,
    cardLookupInDeckCard: cardLookupInDeckCard,
    cardLookupInDeckCardChance: cardLookupInDeckCardChance,
    // -- other
    allDecks: allDecks,
    allDeckName: allDeckNames,
    selectedDeck: selectedDeck,
    unpulledCards: unpulledCards,
    pulledCards: pulledCards,
    cardsToShow: amountMap,
    card: cardToShow,
    nextCard: nextCard,
    percentile: chanceData.chance,
    amount: chanceData.amount,
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
      (c) => c.multiverseid === card.multiverseid);
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
app.post("/removeCardFromDeck/:deckName/:_id/:page", secureMiddleware, async (req, res) => {

  const selectedDeck: Deck | null = await decksCollection.findOne({
    deckName: req.params.deckName,
    userId: res.locals.user._id
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
                index: { $indexOfArray: ["$cards._id", new ObjectId(req.params._id)] }
              },
              // Use the found index to create the new cards array without the specified card
              in: {
                $concatArrays: [
                  // Include all cards before the one to be removed
                  { $slice: ["$cards", 0, { $add: ["$$index", 0] }] },
                  // Include all cards after the one to be removed
                  { $slice: ["$cards", { $add: ["$$index", 1] }, { $size: "$cards" }] }
                ]
              }
            }
          }
        }
      }
    ]
  );

  res.redirect(`/editDeck/${req.params.deckName}?&page=${req.params.page}`);
});
app.post("/addCardTooDeck/:deckName/:_id/:page", secureMiddleware, async (req, res) => {
  const selectedDeck: Deck | null = await decksCollection.findOne({
    deckName: req.params.deckName,
    userId: res.locals.user._id
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
        selectedDeck.cards.filter((e) => e.name == cardTooAdd!.name).length < 4
      ) {
        await decksCollection.updateOne(
          selectedDeck,
          { $push: { cards: cardTooAdd! } }
        );
      } else {
        console.log("4 or more cards");
      }
    } else {
      console.log("Is land card");
      await decksCollection.updateOne(
        selectedDeck,
        { $push: { cards: cardTooAdd! } }
      );
    }
  } else {
    console.log("Deck full");

    // handle alert
  }

  res.redirect(`/editDeck/${req.params.deckName}?&page=${req.params.page}`);
});
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
    deckImageUrl: req.body.imgUrl !== "" ? req.body.imgUrl : "/assets/images/decks/1.webp",
    favorited: false
  }

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
