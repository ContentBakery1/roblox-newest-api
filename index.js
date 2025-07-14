const express = require('express');
const axios = require('axios');
const app = express();

let latestUser = { username: "Loading...", id: 0 };
let lastCheckedId = 0;  // Hoogste userId die je al hebt

// Deze functie checkt één ID hoger dan laatst bekend
async function fetchLatestUser() {
  const currentId = lastCheckedId + 1;
  try {
    const res = await axios.get(`https://users.roproxy.com/v1/users/${currentId}`);
    if (res.data && res.data.name && !res.data.isBanned) {
      latestUser = { username: res.data.name, id: currentId };
      lastCheckedId = currentId;
      console.log(`Nieuwste user gevonden: ${res.data.name} (${currentId})`);
    } else {
      // User niet gevonden of banned, niks doen
    }
  } catch (error) {
    // Vaak 404 bij niet-bestaande userId, gewoon negeren
  }
}

setInterval(fetchLatestUser, 1000); // Elke seconde checken
fetchLatestUser();

app.get('/newest', (req, res) => {
  res.json(latestUser);
});

app.get('/', (req, res) => {
  res.send("✅ Roblox Newest Account API running");
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server draait op poort ${port}`));
