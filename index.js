const express = require('express');
const axios = require('axios');
const app = express();

let latestUser = { username: "Loading...", id: 0 };
const RATE_LIMIT_WAIT = 60_000; // 60 s back‑off bij 429

async function userExists(id) {
  try {
    const res = await axios.get(`https://users.roproxy.com/v1/users/${id}`);
    return res.data?.name && !res.data.isBanned;
  } catch (err) {
    if (err.response?.status === 429) {
      throw new Error('RATE_LIMIT');
    }
    return false;
  }
}

async function findUpperBound() {
  let x = 1e8;
  while (true) {
    try {
      if (await userExists(x)) return x;
      x *= 2;
    } catch (e) {
      if (e.message === 'RATE_LIMIT') throw e;
      x *= 2;
    }
    if (x > 1e11) return x;
  }
}

async function binaryMaxId(lo, hi) {
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    try {
      if (await userExists(mid)) lo = mid;
      else hi = mid - 1;
    } catch (e) {
      if (e.message === 'RATE_LIMIT') throw e;
      hi = mid - 1;
    }
  }
  return lo;
}

async function updateLatestUser() {
  try {
    const ub = await findUpperBound();
    const maxId = await binaryMaxId(Math.floor(ub / 2), ub);
    if (maxId < latestUser.id) {
      console.log(`🔄 Gefilterd: gevonden ID (${maxId}) < huidig (${latestUser.id}), gebruik huidig.`);
      return;
    }
    const res = await axios.get(`https://users.roproxy.com/v1/users/${maxId}`);
    latestUser = { username: res.data.name, id: maxId };
    console.log(`✅ Nieuwste gebruiker: ${res.data.name} (${maxId})`);
  } catch (e) {
    if (e.message === 'RATE_LIMIT') {
      console.warn(`⚠️ Rate‑limit, volgende update over ${RATE_LIMIT_WAIT/1000}s`);
      await new Promise(r => setTimeout(r, RATE_LIMIT_WAIT));
    } else {
      console.error('🔴 Fout bij update:', e.message);
    }
  }
}

(async () => {
  await updateLatestUser();
  setInterval(updateLatestUser, 5000);
})();

app.get('/newest', (req, res) => res.json(latestUser));
app.get('/', (req, res) => res.send("✅ Roblox Newest Account API running"));
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server draait op poort ${port}`));
