import express from 'express';
import fetch from 'node-fetch';

const app = express();
let latest = { userId: 8935680100, username: "" };
const API_BASE = 'https://users.roproxy.com/v1/users';

async function fetchUser(id, retries = 3) {
  try {
    const res = await fetch(`${API_BASE}/${id}`);
    if (res.status === 200) return await res.json();

    if (res.status === 429) {
      const waitTime = (Number(res.headers.get('retry-after')) || 5) * 1000;
      console.log(`[429] Wacht ${waitTime / 1000}s`);
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
  let hi = lo;
  let nullCount = 0;

  console.log(`🔍 Start verdubbelen vanaf ${lo}`);
  while (nullCount < 3) {
    hi *= 2;
    console.log(`Check hi = ${hi}`);
    const u = await fetchUser(hi);
    if (u) {
      lo = hi;
      nullCount = 0;
      console.log(`🚀 Bestaat: ${hi}, ga verder`);
    } else {
      nullCount++;
      console.log(`🔕 Geen user op ${hi} (nullCount=${nullCount})`);
    }
  }

  // Binaire zoekactie tussen lo en hi
  let low = lo;
  let high = hi;
  while (high - low > 1) {
    const mid = Math.floor((low + high) / 2);
    const u = await fetchUser(mid);
    if (u) {
      low = mid;
    } else {
      high = mid;
    }
  }

  const uFinal = await fetchUser(low);
  if (uFinal && low > latest.userId) {
    latest = { userId: low, username: uFinal.name };
    console.log(`✅ Nieuwste gebruiker: ${latest.username} (${latest.userId})`);
  } else {
    console.log(`🔍 Geen nieuwere gebruiker dan ${latest.userId}`);
  }
}

async function poll() {
  while (true) {
    try {
      await findLatest();
    } catch (e) {
      console.error("Error tijdens zoeken:", e);
    }
    await new Promise(r => setTimeout(r, 5000));
  }
}

app.get('/latest.json', (req, res) => res.json(latest));

app.listen(3000, () => {
  console.log('Luistert op poort 3000');
  poll();
});
