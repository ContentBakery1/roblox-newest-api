import express from 'express';
import fetch from 'node-fetch';

const app = express();
const PORT = 3000;

// Startpunt
let latest = { userId: 8946447250, username: "" };
const API_BASE = 'https://users.roproxy.com/v1/users';

async function fetchUser(id, retries = 3) {
  try {
    const res = await fetch(`${API_BASE}/${id}`);
    
    if (res.status === 200) {
      const data = await res.json();
      return data;
    }

    if (res.status === 429) {
      const waitTime = (Number(res.headers.get('retry-after')) || 5) * 1000;
      console.log(`[429] Rate limited, wachten ${waitTime / 1000}s`);
      await new Promise(r => setTimeout(r, waitTime));
      return fetchUser(id, retries);
    }

    // Andere fout (404 of 403 bij bijv. deleted accounts)
    return null;
    
  } catch (err) {
    if (retries > 0) {
      console.warn(`⚠️ Fout bij ID ${id}: ${err.message}, opnieuw proberen...`);
      await new Promise(r => setTimeout(r, 2000));
      return fetchUser(id, retries - 1);
    } else {
      console.error(`❌ Gefaalde fetch na retries (${id}): ${err.message}`);
      return null;
    }
  }
}

async function poll() {
  while (true) {
    const nextId = latest.userId + 1;
    const user = await fetchUser(nextId);

    if (user) {
      latest = { userId: nextId, username: user.name };
      console.log(`✅ Nieuwste gebruiker gevonden: ${user.name} (${nextId})`);
    } else {
      console.log(`❌ Geen gebruiker bij ID ${nextId}`);
    }

    await new Promise(r => setTimeout(r, 5000)); // 5 sec delay tussen checks
  }
}

app.get('/latest.json', (req, res) => {
  res.json(latest);
});

app.listen(PORT, () => {
  console.log(`🚀 Server actief op poort ${PORT}`);
  poll(); // start polling loop zodra server start
});
