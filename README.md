# Codecaster Wizards - Magic: The Gathering Web App

## Inhoudsopgave

- [Project Beschrijving](#project-beschrijving)
  - [De opdracht](#de-opdracht)
  - [Gemeenschappelijk](#gemeenschappelijk)
  - [API](#api)
  - [Kaarten ophalen van API](#kaarten-ophalen-van-api)
  - [Inzoomen op kaart en toevoegen aan database](#inzoomen-op-kaart-en-toevoegen-aan-database)
  - [Deck controle](#deck-controle)
  - [Decktest](#decktest)
- [Extra functies](#extra-functies)
- [Richtlijnen voor bijdragen](#richtlijnen-voor-bijdragen)
- [Licentie](#licentie)

## Project Beschrijving

Codecaster Wizards is een webapplicatie in ontwikkeling voor onze WPL-klas, toegewijd aan het creëren van een gebruiksvriendelijk platform voor Magic: The Gathering enthousiastelingen.

### De opdracht

De opdracht is om een project te simuleren in een werkomgeving. Onze klas werd verdeeld in groepen van 3, en elke groep mocht kiezen uit 6 verschillende projecten.

Het project dat we kozen was Magic: The Gathering. De vereisten voor het project zijn als volgt.

### Gemeenschappelijk

Elk project dat je kon kiezen heeft dit.

De gebruiker komt aan op een startpagina waar alle projecten die we konden kiezen worden weergegeven. Deze hebben minimaal de naam van het project en een afbeelding. De gebruiker kiest het project dat is gemaakt door de groep. Als je nog niet bent ingelogd, krijgt de gebruiker een melding om eerst in te loggen. (Decks zijn gebruikersgebonden, dus gebruiker A kan verschillende decks hebben dan gebruiker B). Wanneer de gebruiker op een ander project klikt, krijgen ze een melding dat ze niet kunnen deelnemen (mag hardcoded zijn). Vervolgens komt de gebruiker op de startpagina van het project.

### API

De API die wordt gebruikt voor dit project is [https://docs.magicthegathering.io/](https://docs.magicthegathering.io/)

### Kaarten ophalen van API

Het moet mogelijk zijn om tekst in te voeren in een zoekbalk. Wanneer je zoekt, worden de eerste 10 kaarten met hun afbeelding en tekst weergegeven.

BONUS: Je krijgt alle kaarten met de tekst gepagineerd (als er 200 kaarten zijn, krijg je 20 tabbladen waar je doorheen kunt klikken).

BONUS:

- Gewone kaarten krijgen een witte rand.
- Ongewone kaarten krijgen een groene rand.
- Zeldzame kaarten krijgen een gele rand.
- Mythic rare kaarten krijgen een rode rand.

BONUS: Wanneer je over een kaart zweeft, worden ze iets groter.

### Inzoomen op kaart en toevoegen aan database

Je kunt op een kaart klikken en het volgende gebeurt.

- De kaart wordt vergroot "Op dezelfde pagina" (BONUS).
- Je opent een nieuwe pagina waarop de kaart is vergroot.

Naast de vergrote kaart krijg je de optie om de kaart aan een deck toe te voegen (dat lokaal in een database wordt bewaard). Je ziet ook enkele kenmerken van de kaart. Als een kaart al in een bepaald deck zit, zie je in welk(e) deck(s).

### Deck controle

Logica voor decks.

- Elk deck heeft een naam.
- Elk deck heeft ook een achtergrond die wordt bewaard als een URL.
- Een deck heeft maximaal 60 kaarten.
- Elke kaart kan slechts 4 keer voorkomen, met uitzondering van 'Land' kaarten.
- Gemiddelde mana-kosten van kaarten ('Land' kaarten niet meegerekend).

Bij het tonen van een lijst met decks zie je de achtergrond met daaronder de naam. Het moet mogelijk zijn om een kaart te verwijderen. Het moet mogelijk zijn om de hoeveelheid van een kaart te wijzigen.

### Decktest

Neem een deck en kijk hoe je trekt. Schud eerst alle kaarten in het deck. Trek dan een kaart uit het deck.

(Je eindigt met 2 stapels: 1 stapel, de stapel van waaruit je trekt, 1 stapel, de al getrokken kaarten met de laatste kaart bovenop). Je krijgt ook een weergave van de al getrokken kaarten.

BONUS: Je kunt de naam van een kaart opgeven om de kans te controleren om die kaart in het deck te trekken.

## Extra functies

Op dit moment zijn er nog geen extra functies.

## Licentie

Dit project is gelicentieerd onder de [Your License] - zie het [LICENSE.md](LICENSE.md)-bestand voor details.

## Contactinformatie (Optioneel)

Voor ondersteuning of vragen, neem contact met ons op via [jouw.email@example.com](mailto:jouw.email@example.com).
