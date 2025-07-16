import express from 'express';
import fetch from 'node-fetch';

const app = express();
let maxId = 8935320620;
let latest = { userId: 0, username: "" };

async function fetchUser(id) {
  const res = await fetch(`https://users.roblox.com/v1/users/${id}`);
  if (res.status === 200) return res.json();
  if (res.status === 429) {
    const retry = res.headers.get('retry-after');
    const waitTime = (retry ? +retry : 5) * 1000;
    console.log(`Rate limited, wacht ${waitTime / 1000} seconden...`);
    await new Promise(r => setTimeout(r, waitTime));
    return fetchUser(id);
  }
  return null;
}

async function findLatest() {
  let lo = maxId;
  let hi = lo + 100000;

  while (true) {
    const u = await fetchUser(hi);
    if (u) break;
    hi = lo + Math.floor((hi - lo) / 2);
    if (hi <= lo) break;
  }

  while (hi - lo > 1) {
    const mid = Math.floor((lo + hi) / 2);
    const u = await fetchUser(mid);
    if (u) lo = mid; else hi = mid;
  }

  const u = await fetchUser(lo);
  if (u && lo > latest.userId) {
    maxId = lo;
    latest = { userId: lo, username: u.name };
    console.log("Nieuwste account:", latest);
  }
}

async function poll() {
  while (true) {
    try {
      await findLatest();
    } catch (e) {
      console.error("Error:", e);
      // Wacht even om niet te crashen
      await new Promise(r => setTimeout(r, 3000));
    }
  }
}

poll();

app.get('/latest.json', (req, res) => res.json(latest));
app.listen(3000, () => console.log('Luistert op poort 3000'));
