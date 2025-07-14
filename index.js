const express = require('express');
const axios = require('axios');
const app = express();

let latestUser = { username: "Loading...", id: 0 };

// Begin bij 0 of hoogste opgeslagen userId
let lastCheckedId = 0;

// Interval in milliseconden
const checkInterval = 1000;

async function fetchLatestUser() {
  const currentId = lastCheckedId + 1;
  try {
    const res = await axios.get(`https://users.roproxy.com/v1/users/${currentId}`);
    if (res.data && res.data.name && !res.data.isBanned) {
      latestUser = { username: res.data.name, id: currentId };
      lastCheckedId = currentId;
      console.log(`Newest user updated: ${res.data.name} (${currentId})`);
    }
    // Als geen gebruiker gevonden of banned, gewoon wachten op volgende check
  } catch (error) {
    // Meestal een 404 bij niet-bestaande userId, gewoon negeren
  }
}

setInterval(fetchLatestUser, checkInterval);
fetchLatestUser();

app.get('/newest', (req, res) => {
  res.json(latestUser);
});

app.get('/', (req, res) => {
  res.send("✅ Roblox Newest Account API running");
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Running on ${port}`));
