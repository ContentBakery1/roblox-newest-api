const express = require('express');
const axios = require('axios');
const app = express();

let latestUser = { username: "Loading..." };

async function fetchLatestUser() {
  for (let id = 4000000000; id > 1; id--) {
    try {
      const res = await axios.get(`https://users.roproxy.com/v1/users/${id}`);
      if (res.data && res.data.name && !res.data.isBanned) {
        latestUser = { username: res.data.name };
        break;
      }
    } catch (_) {}
  }
}

setInterval(fetchLatestUser, 1000); // update elke 1 seconde
fetchLatestUser();

app.get('/newest', (req, res) => {
  res.json(latestUser);
});

app.get('/', (req, res) => {
  res.send("✅ Roblox Newest Account API running");
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Running on ${port}`));
