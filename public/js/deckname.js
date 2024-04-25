document.getElementById("deckNameForm").addEventListener("submit", function (event) {
    event.preventDefault();

    let deckName = document.getElementById("deckNameInput").value;

    document.getElementById("deckName").innerText = deckName;
  });
