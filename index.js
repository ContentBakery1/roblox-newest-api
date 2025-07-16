import express from 'express';
import fetch from 'node-fetch';

const app = express();
let latest = { userId: 8935680100, username: "" };
const API_BASE = 'https://users.roproxy.com/v1/users';  // Gebruik roproxy

async function fetchUser(id, retries = 3) {
  try {
    const res = await fetch(`${API_BASE}/${id}`);
    if (res.status === 200) return await res.json();

    if (res.status === 429) {
      const retryAfter = res.headers.get('retry-after');
      const waitTime = (retryAfter ? +retryAfter : 5) * 1000;
      console.log(`[429] Wacht ${waitTime/1000}s`);
      await new Promise(r => setTimeout(r, waitTime));
      return fetchUser(id, retries);
    }

    return null;
  } catch (err) {
    if (retries > 0) {
      console.warn(`Fout bij ID ${id}: ${err.message}, probeer opnieuw...`);
      await new Promise(r => setTimeout(r, 2000));
      return fetchUser(id, retries - 1);
    } else {
      console.error(`Gefaalde fetch na retries (${id}): ${err.message}`);
      return null;
    }
  }
}

async function findLatest() {
  let lo = latest.userId;
  let hi = lo * 2;  // start met verdubbelen

  while (true) {
    console.log(`Check hi = ${hi}`);
    const u = await fetchUser(hi);
    if (u) break;
    lo = hi;
    hi *= 2;
    if (hi > lo + 1e10) {
      console.error("Hi waarde te groot, stop search");
      return;
    }
  }

  while (hi - lo > 1) {
    const mid = Math.floor((lo + hi) / 2);
    const u = await fetchUser(mid);
    if (u) lo = mid;
    else hi = mid;
  }

  const u = await fetchUser(lo);
  if (u && lo > latest.userId) {
    latest = { userId: lo, username: u.name };
    console.log("Nieuwste account gevonden:", latest);
  }
}

async function poll() {
  while (true) {
    try {
      await findLatest();
    } catch (e) {
      console.error("Error tijdens zoeken:", e);
    }
    await new Promise(r => setTimeout(r, 5000)); // poll elke 5 seconden
  }
}

app.get('/latest.json', (req, res) => {
  res.json(latest);
});

app.listen(3000, () => {
  console.log('Luistert op poort 3000');
  poll();
});
