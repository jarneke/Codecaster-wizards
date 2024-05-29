import express from "express";
import { secureMiddleware } from "../secureMiddleware";
import {
  Deck,
  PageData,
  Card,
  Tip,
} from "../interfaces";
import {
  getDecksOfUser,
  handlePageClickEvent,
  getAvgManaCost,
  getCardWAmauntForPage,
  getRandomNumber,
  getTips,
  getDecksForPage,
} from "../functions";
import { getTotalPages } from "../functions";
import { cardsCollection, decksCollection } from "../db";
import { ObjectId } from "mongodb";
import { flashMiddleware } from "../fleshMiddleware";
import e from "express";


export default function deckRouter() {
  const router = express.Router();

  router.use(flashMiddleware);

  router.get("/decks", secureMiddleware, async (req, res) => {
    // params from route
    // Pagination
    let pageSize: number = 9;
    let pageData: PageData = handlePageClickEvent(req.query);
    let allDecksOfUser = await getDecksOfUser(res)
    let decksForPage = getDecksForPage(allDecksOfUser, pageData.page, pageSize)

    let totalPages = getTotalPages(allDecksOfUser.length, pageSize);

    if (decksForPage.length === 0) {
      return res.redirect("/noDeck");
    }

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
  router.get("/noDeck", secureMiddleware, (req, res) => {
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
  router.get("/decks/:deckName", secureMiddleware, async (req, res) => {
    // params from route
    let cardLookup = req.query.cardLookup;
    let sort = req.query.sort;
    let sortDirection = req.query.sortDirection;

    // initialize alltips array
    let allTips: Tip[] = await getTips();

    // IMPORANT: This isnt gonna work,  need to filter by userId too, else 2 people with same deckName will conflict
    const selectedDeck: Deck | null = await decksCollection.findOne({
      deckName: req.params.deckName,
    });
    if (!selectedDeck) {
      return res.redirect("/404");
    }
    let amountMap = new Map<Card, number>();
    for (const card of selectedDeck.cards) {
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
    let amountLandcards: number | undefined = undefined;
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
    let avgManaCost: number | undefined = undefined;

    if (selectedDeck.cards.length === 0) {
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
      cards: sortedAmountMap,
      selectedDeck: selectedDeck,
      tip: allTips[getRandomNumber(0, allTips.length - 1)],
      amountLandcards: amountLandcards,
      avgManaCost: avgManaCost,
    });
  });
  router.post("/changeDeckName", secureMiddleware, async (req, res) => {
    const name = req.body.deckNameInput;
    const oldName = req.body.oldDeckName;

    try {
      if (name.includes(' ')) {
        throw new Error("Deck naam mag geen spaties bevatten")
      }
      const specialCharRegEx = /[?#@!$%^&*()]/
      if (specialCharRegEx.test(name)) {
        throw new Error("Je decknaam mag geen van de volgende characters bevatten: ?#@!$%^&*()");
      }
    } catch (e: any) {
      req.session.message = { type: "error", message: e.message}
      return res.redirect(`/editDeck/${oldName}`)
    }
    const oldDeck = await decksCollection.findOne({ deckName: oldName, userId: res.locals.user._id });

    decksCollection.updateOne(
      { _id: oldDeck?._id },
      { $set: { deckName: name } }
    );

    res.redirect(`/editDeck/${name}`);
  });
  router.get("/editDeck/:deckName", secureMiddleware, async (req, res) => {
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
  router.post("/removeCardFromDeck/:deckName/:_id/:page", secureMiddleware, async (req, res) => {

    const selectedDeck: Deck | null = await decksCollection.findOne({
      deckName: req.params.deckName,
      userId: res.locals.user._id
    });
    if (!selectedDeck) {
      return res.redirect("/404");
    }
    let newCards = selectedDeck.cards;
    let removed = false;
    newCards = newCards.filter((card) => {
      if (`${card._id}` === req.params._id && !removed) {
        removed = true;
        return false;
      }
      return true;
    });

    await decksCollection.updateOne(
      selectedDeck, {
      $set: { cards: newCards }
    }
    );

    req.session.message = { type : "success", message : "Kaart verwijderd"};

    res.redirect(`/editDeck/${req.params.deckName}?&page=${req.params.page}`);
  });
  router.post("/addCardTooDeck/:deckName/:_id/:page", secureMiddleware, async (req, res) => {
    req.session.message = { type: "success", message: "Kaart toegevoegd" }
    const selectedDeck: Deck | null = await decksCollection.findOne({
      deckName: req.params.deckName,
      userId: res.locals.user._id
    });
    if (!selectedDeck) {
      console.log("Deck not found");
      
      return res.redirect("/404");
    }

    let cardTooAdd = selectedDeck.cards.find(e=> `${e._id}` === `${req.params._id}`)
    if (!cardTooAdd) {
      console.log("card not found");
      req.session.message = {type: "error", message: "Fout bij kaart vinden" + req.params._id}
      return res.redirect(`/editDeck/${req.params.deckName}?&page=${req.params.page}`);
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
          req.session.message = { type: "error", message: "Je kan niet meer dan 4 kaarten van dit type toevoegen" }
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
      req.session.message = { type: "error", message: "Je deck zit vol!" }
      // handle alert
    }

    res.redirect(`/editDeck/${req.params.deckName}?&page=${req.params.page}`);
  });
  router.get("/makeDeck", secureMiddleware, async (req, res) => {
    // to-do: make alert when deck exists

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
  router.post("/deleteDeck", secureMiddleware, async (req, res) => {
    let deckName = req.body.deckName;

    try {
      const deleteQuery = await decksCollection.deleteOne({ deckName: deckName });
      if (deleteQuery.deletedCount === 0) {
        throw new Error("Fout bij het verwijderen van een deck")
      }
      req.session.message = { type: "success", message: "Deck verwijderd" }
      res.redirect("/decks");
    } catch (e: any) {
      req.session.message = { type: "error", message: e.message }
      res.redirect("/decks")
    }

  });
  router.post("/makeDeck", secureMiddleware, async (req, res) => {
    try {
      if (await decksCollection.findOne({ deckName: req.body.deckName, userId: res.locals.user._id })) {
        throw new Error("Je kan geen 2 decks met eenzelfde naam hebben")
      };
      const specialCharRegEx = /[?#@!$%^&*()]/
      if (specialCharRegEx.test(req.body.deckName)) {
        throw new Error("Je decknaam mag geen van de volgende characters bevatten: ?#@!$%^&*()");
      }

      let newDeck: Deck = {
        userId: res.locals.user._id,
        deckName: req.body.deckName,
        cards: [],
        deckImageUrl: req.body.imgUrl !== "" ? req.body.imgUrl : "/assets/images/decks/1.webp",
        favorited: false
      }

      await decksCollection.insertOne(newDeck);

      req.session.message = { type: "success", message: "Deck toegevoegd" }
      res.redirect("/decks");
    } catch (e: any) {
      req.session.message = { type: "error", message: e.message }
      return res.redirect("/makeDeck");
    }
  });
  return router;
}
