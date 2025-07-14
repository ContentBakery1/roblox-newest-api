const express = require('express');
const axios = require('axios');
const app = express();

let latestUser = { username: "Loading...", id: 0 };

// Cache de laatst gevonden userId om niet steeds vanaf 4 miljard te zoeken
let lastCheckedId = 4000000000;

async function fetchLatestUser() {
  for (let id = lastCheckedId; id > 1; id--) {
    try {
      const res = await axios.get(`https://users.roproxy.com/v1/users/${id}`);
      if (res.data && res.data.name && !res.data.isBanned) {
        latestUser = { username: res.data.name, id: id };
        lastCheckedId = id - 1; // ga volgende keer iets lager zoeken
        break;
      }
    } catch (_) {
      // fout negeren en doorgaan
    }
  }
}

setInterval(fetchLatestUser, 1000); // update elke seconde
fetchLatestUser();

app.get('/newest', (req, res) => {
  res.json(latestUser);
});

app.get('/', (req, res) => {
  res.send("✅ Roblox Newest Account API running");
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Running on ${port}`));
