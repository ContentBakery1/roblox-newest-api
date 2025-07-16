import express from 'express';
import fetch from 'node-fetch';

const app = express();
let latest = { userId: 0, username: "" };

async function fetchUser(id) {
  const res = await fetch(`https://users.roblox.com/v1/users/${id}`);
  if (res.status === 200) return res.json();
  return null;
}

async function findLatest() {
  let lo = 8935498500;
  let hi = lo + 100000;

  while (true) {
    const u = await fetchUser(hi);
    if (u) break;
    hi = lo + Math.floor((hi - lo) / 2);
  }

  while (hi - lo > 1) {
    const mid = Math.floor((lo + hi) / 2);
    const u = await fetchUser(mid);
    if (u) lo = mid; else hi = mid;
  }

  const u = await fetchUser(lo);
  if (u && lo > latest.userId) {
    latest = { userId: lo, username: u.name };
    console.log("Nieuwste account:", latest);
  }
}

app.get('/latest.json', (req, res) => res.json(latest));

app.listen(3000, () => {
  console.log('Luistert op poort 3000');
  findLatest(); // Initialiseer bij opstarten
});
