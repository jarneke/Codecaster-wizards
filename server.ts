import express from "express";
import ejs from "ejs";

const app = express();

app.set("port", 3000);
app.set("view engine", "ejs");

app.use(express.static("public"));

app.get("/", (req, res) => {
    res.render("landingspage")
})
app.get("/home", (req, res) => {
    res.render("home")
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

app.listen(app.get("port"), () => {
    console.log("[ - SERVER - ] Listening at http://localhost:" + app.get("port")
    );
})