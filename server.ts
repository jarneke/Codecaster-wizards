import express from "express";
import ejs from "ejs";
import * as I from "./interfaces";

const app = express();


app.set("port", 3000);
app.set("view engine", "ejs");

app.use(express.static("public"));

app.get("/", (req, res) => {
    res.render("landingspage")
})
app.get("/home", (req, res) => {
    res.render("home", {
        user: I.tempUser,
        // The names of the js files you want to load on the page.
        jsFiles: ["infoPopUp", "manaCheckbox", "tooltips"],
        // The title of the page
        title: "Home page",
        // The Tab in the nav bar you want to have the orange color (0 = home, 1 = decks nakijken, 2 = deck simuleren, alle andere waarden zorgt voor geen verandering van kleur)
        tabToColor: 0,
    })
})
app.get("/decks", (req, res) => {
    res.render("decks")
})
app.get("/deckdetails", (req, res) => {
    res.render("deckdetails")
})
app.get("/drawtest", (req, res) => {
    res.render("drawtest")
})
app.get("/profile", (req, res) => {
    res.render("profile")
})

app.listen(app.get("port"), async () => {
    console.log("[ - SERVER - ] Listening at http://localhost:" + app.get("port"));
    let data = await fetch("https://api.magicthegathering.io/v1/cards")
    data = await data.json();
    console.log("[ - SERVER - ] API fetched");

})