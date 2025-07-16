const express = require('express');
const axios = require('axios');
const app = express();

let latestUser = { username: "Loading...", id: 0 };
let currentId = 0;
const BATCH_SIZE = 1000; // Grootte van de zoekbatch

// Stap 1: bepaal de hoogste user-ID door een grote sprong
async function initStartId() {
  let testId = 1e8; // begin met 100 miljoen
  while (testId > 0) {
    try {
      const res = await axios.get(`https://users.roproxy.com/v1/users/${testId}`);
      if (res.data && res.data.name) {
        currentId = testId;
        console.log(`Start-ID ingesteld op ${currentId}`);
        return;
      }
    } catch (e) {
      // ID te hoog, verlaag testId
      testId = Math.floor(testId / 2);
    }
  }
  console.error('Kon geen start-ID vinden, blijf bij 0');
}

// Stap 2: haal steeds een batch af en zoek de nieuwste
async function fetchLatestUser() {
  const start = currentId;
  const end = Math.max(1, currentId - BATCH_SIZE + 1);
  console.log(`Scannen IDs ${start} → ${end}`);

  for (let id = start; id >= end; id--) {
    try {
      const res = await axios.get(`https://users.roproxy.com/v1/users/${id}`);
      currentId = id - 1; // volgende keer lagere ID
      if (res.data && res.data.name && !res.data.isBanned) {
        latestUser = { username: res.data.name, id };
        console.log(`Nieuwste user: ${res.data.name} (${id})`);
        break;
      }
    } catch (error) {
      currentId = id - 1;
    }
  }
}

(async () => {
  await initStartId();
  await fetchLatestUser();
  setInterval(fetchLatestUser, 10_000); // elke 10 s
})();

app.get('/newest', (req, res) => res.json(latestUser));
app.get('/', (req, res) => res.send("✅ Roblox Newest Account API running"));
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server draait op poort ${port}`));
