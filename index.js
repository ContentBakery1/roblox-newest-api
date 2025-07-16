import express from 'express';
import fetch from 'node-fetch';

const app = express();
let latest = { userId: 8935807100, username: "" };

async function fetchUser(id, retries = 3) {
  try {
    const res = await fetch(`https://users.roblox.com/v1/users/${id}`);

    if (res.status === 200) return await res.json();

    if (res.status === 429) {
      const retryAfter = res.headers.get('retry-after');
      const waitTime = (retryAfter ? +retryAfter : 5) * 1000;
      console.log(`[429] Wacht ${waitTime / 1000}s`);
      await new Promise(r => setTimeout(r, waitTime));
      return fetchUser(id, retries);
    }

    return null;

  } catch (err) {
    if (retries > 0) {
      console.warn(`Fout bij ID ${id}: ${err.message}, probeer opnieuw...`);
      await new Promise(r => setTimeout(r, 2000)); // 2 seconden pauze
      return fetchUser(id, retries - 1);
    } else {
      console.error(`Gefaalde fetch na retries (${id}): ${err.message}`);
      return null;
    }
  }
}

async function findLatest() {
  let lo = latest.userId;
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
    if (u) lo = mid;
    else hi = mid;
  }

  const u = await fetchUser(lo);
  if (u && lo > latest.userId) {
    latest = { userId: lo, username: u.name };
    console.log("Nieuwste account:", latest);
  }
}

async function poll() {
  while (true) {
    try {
      await findLatest();
    } catch (e) {
      console.error("Error tijdens zoeken:", e.message || e);
    }
    await new Promise(resolve => setTimeout(resolve, 1000)); // 1 seconde delay
  }
}

app.get('/latest.json', (req, res) => res.json(latest));

app.listen(3000, () => {
  console.log('Luistert op poort 3000');
  poll(); // Start direct met zoeken
});
