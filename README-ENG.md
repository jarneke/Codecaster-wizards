# Codecaster Wizards - Magic: The Gathering Web App

[Nederlandse versie](README.md)

## Table of Contents

- [How to start the app](#how-to-start-the-app)
- [Project Description](#project-description)
  - [The assignment](#the-assignment)
  - [Common](#common)
  - [API](#api)
  - [Fetching Cards from API](#fetching-cards-from-api)
  - [Zooming in on Card and Adding to Database](#zooming-in-on-card-and-adding-to-database)
  - [Deck Control](#deck-control)
  - [Deck Testing](#deck-testing)
- [Extra Features](#extra-features)
- [Contribution Guidelines](#contribution-guidelines)

## How to start the app

Currently, the app is not hosted online, so you need to run it via localhost on your PC.

Here's how to do it.

- 1. Download the repository as a .zip file.
- 2. Extract the .zip file and save it wherever you want.
- 3. The app requires environment variables to function. So, create a ".env" file and refer to the ".env.example" file to know what to put in it.
- 4. Now, open a terminal and in the app's directory, type `npm start`. This will install the necessary packages and start the app.

## Project Description

Codecaster Wizards is a web application under development for our WPL class, dedicated to creating a user-friendly platform for Magic: The Gathering enthusiasts.

### The assignment

The assignment is to simulate a project in a work environment. Our class was divided into groups of 3, and each group could choose from 6 different projects.

The project we chose was Magic: The Gathering. The requirements for the project are as follows.

### Common

Every project you could choose from has this.

The user arrives at a homepage displaying all the projects we could choose from. These display at least the name of the project and an image. The user selects the project made by the group. If not logged in yet, the user receives a prompt to log in first. (Decks are user-specific, so User A may have different decks than User B). When the user clicks on another project, they receive a notification that they cannot participate (can be hardcoded). Then, the user lands on the project's homepage.

### API

The API used for this project is [https://docs.magicthegathering.io/](https://docs.magicthegathering.io/)

### Fetching Cards from API

It should be possible to enter text in a search bar. When you search, the first 10 cards with their images and text are displayed.

BONUS: You get all the cards paginated by text (if there are 200 cards, you get 20 tabs you can click through).

BONUS:

- Common cards get a white border.
- Uncommon cards get a green border.
- Rare cards get a yellow border.
- Mythic rare cards get a red border.

BONUS: When hovering over a card, they become slightly larger.

### Zooming in on Card and Adding to Database

You can click on a card, and the following happens.

- The card is enlarged "On the same page" (BONUS).
- You open a new page displaying the enlarged card.

Alongside the enlarged card, you get the option to add the card to a deck (which is stored locally in a database). You also see some characteristics of the card. If a card is already in a specific deck, you see in which deck(s).

### Deck Control

Deck logic.

- Each deck has a name.
- Each deck also has a background stored as a URL.
- A deck can have a maximum of 60 cards.
- Each card can appear only 4 times, except for 'Land' cards.
- Average mana cost of cards (excluding 'Land' cards).

When showing a list of decks, you see the background with the name underneath. It should be possible to remove a card. It should be possible to change the quantity of a card.

### Deck Testing

Take a deck and see how you draw. First, shuffle all the cards in the deck. Then, draw a card from the deck.

(You end up with 2 piles: 1 pile, the pile you draw from, 1 pile, the cards already drawn with the last card on top). You also get a display of the cards already drawn.

BONUS: You can specify the name of a card to check the probability of drawing that card in the deck.

## Extra Features

There are currently no extra features.
