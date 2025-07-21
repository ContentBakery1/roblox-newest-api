import express from 'express';
import fetch from 'node-fetch';

const app = express();
const PORT = 3000;

let latest = { userId: 8977837670, username: "" };
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
    let currentId = latest.userId;
    let foundNew = false;

    for (let i = 1; i <= 1000; i++) {
      const tryId = currentId + i;
      const user = await fetchUser(tryId);

      if (user) {
        latest = { userId: tryId, username: user.name };
        console.log(`✅ Nieuwste gebruiker gevonden: ${user.name} (${tryId})`);
        foundNew = true;
        await new Promise(r => setTimeout(r, 10)); // 10ms tussen requests
      } else {
        break; // Stop als ID niet bestaat
      }
    }

    if (!foundNew) {
      console.log(`⏸️ Geen nieuwe gebruikers tussen ${currentId + 1} en ${currentId + 1000}`);
    }

    await new Promise(r => setTimeout(r, 5000)); // korte pauze voor volgende ronde
  }
}

app.get('/latest.json', (req, res) => {
  res.json(latest);
});

app.listen(PORT, () => {
  console.log(`🚀 Server actief op poort ${PORT}`);
  poll();
});
