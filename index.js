const express = require('express');
const axios = require('axios');
const app = express();

let latestUser = { username: "Loading...", id: 0 };

async function userExists(id) {
  try {
    const res = await axios.get(`https://users.roproxy.com/v1/users/${id}`);
    return res.data?.name && !res.data.isBanned;
  } catch {
    return false;
  }
}

async function findUpperBound() {
  // Zoek een bovengrens waar user wel bestaat, start bij 1e8 en verdubbel als nodig
  let x = 1e8;
  while (!(await userExists(x))) {
    x *= 2;
    if (x > 1e10) break; // stop bij een te grote waarde om infinite loop te voorkomen
  }
  return x;
}

async function binaryMaxId(lo, hi) {
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (await userExists(mid)) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}

async function updateLatestUser() {
  try {
    const ub = await findUpperBound();
    const maxId = await binaryMaxId(Math.floor(ub / 2), ub);
    const res = await axios.get(`https://users.roproxy.com/v1/users/${maxId}`);
    latestUser = { username: res.data.name, id: maxId };
    console.log(`✅ Nieuwste gebruiker: ${res.data.name} (${maxId})`);
  } catch (error) {
    console.error('Fout bij updaten nieuwste gebruiker:', error.message);
  }
}

(async () => {
  await updateLatestUser();
  setInterval(updateLatestUser, 5000); // update elke 5 seconden
})();

app.get('/newest', (req, res) => res.json(latestUser));
app.get('/', (req, res) => res.send("✅ Roblox Newest Account API running"));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server draait op poort ${port}`));
