const express = require('express');
const axios = require('axios');
const app = express();

let latestUser = { username: "Loading...", id: 0 };
let lastCheckedId = 0;

async function fetchLatestUser() {
  try {
    const res = await axios.get(`https://users.roproxy.com/v1/users/${lastCheckedId + 1}`);
    if (res.data && res.data.name && !res.data.isBanned) {
      latestUser = { username: res.data.name, id: lastCheckedId + 1 };
      lastCheckedId++;
      console.log(`Nieuwste user gevonden: ${res.data.name} (${lastCheckedId})`);
    } else {
      console.log(`User ${lastCheckedId + 1} is niet actief of geblokkeerd.`);
      lastCheckedId++;
    }
  } catch (error) {
    console.log(`Fout bij het ophalen van gebruiker met ID ${lastCheckedId + 1}: ${error.message}`);
    lastCheckedId++;
  }
}

setInterval(fetchLatestUser, 1000);
fetchLatestUser();

app.get('/newest', (req, res) => {
  res.json(latestUser);
});

app.get('/', (req, res) => {
  res.send("✅ Roblox Newest Account API running");
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server draait op poort ${port}`));
