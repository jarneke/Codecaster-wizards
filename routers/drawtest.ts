import express from "express"
import { secureMiddleware } from "../secureMiddleware"
import { Card, Deck, PageData, filterTypes, filterRarities } from "../interfaces"
import { decksCollection } from "../db";
import { shuffleCards, getChance, filterAndSortCards, handlePageClickEvent, getTotalPages, getCardWAmauntForPage, getDecksOfUser, } from "../functions";

export default function drawtestRouter() {

    const router = express.Router();

    // variable to store last selected deck on drawtest page
    let lastSelectedDeck: Deck;
    // variable to store selected deck
    let selectedDeck: Deck | null = null;
    // variable to store unpulled cards of drawtest page
    let unpulledCards: Card[] = [];
    // variable to store pulled cards of drawtest page
    let pulledCards: Card[] = [];
    router.get("/", secureMiddleware, async (req, res) => {
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
        let selectedDeckQuery = req.query.deck;

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
    return router;
}