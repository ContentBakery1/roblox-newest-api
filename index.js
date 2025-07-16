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
  let x = 1e8;
  while (!(await userExists(x)) && x > 1) {
    x = Math.floor(x / 2);
  }
  return x;
}

async function binaryMaxId(lo, hi) {
  while (lo < hi) {
    const mid = Math.ceil((lo + hi + 1) / 2);
    if (await userExists(mid)) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}

async function updateLatestUser() {
  const ub = await findUpperBound();
  const maxId = await binaryMaxId(Math.floor(ub / 2), ub * 2);
  const res = await axios.get(`https://users.roproxy.com/v1/users/${maxId}`);
  latestUser = { username: res.data.name, id: maxId };
  console.log(`✅ Nieuwste gebruiker: ${res.data.name} (${maxId})`);
}

(async () => {
  await updateLatestUser();
  setInterval(updateLatestUser, 60_000); // update elke minuut
})();

app.get('/newest', (req, res) => res.json(latestUser));
app.get('/', (req, res) => res.send("✅ Roblox Newest Account API running"));
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server draait op poort ${port}`));
