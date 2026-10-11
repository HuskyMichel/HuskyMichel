const admin = require("firebase-admin");

const API_KEY = process.env.YOUTUBE_API_KEY;
const SERVICE_ACCOUNT_JSON = process.env.FIREBASE_SERVICE_ACCOUNT;

if (!API_KEY || !SERVICE_ACCOUNT_JSON) {
  throw new Error("Secrets YOUTUBE_API_KEY ou FIREBASE_SERVICE_ACCOUNT manquant.");
}

const serviceAccount = JSON.parse(SERVICE_ACCOUNT_JSON);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function youtubeApi(endpoint, params) {
  const url = new URL(`https://www.googleapis.com/youtube/v3/${endpoint}`);
  for (const [key, value] of Object.entries({ ...params, key: API_KEY })) {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }

  const response = await fetch(url);
  const body = await response.json();

  if (!response.ok) {
    const message = body?.error?.message || `Erreur YouTube API (${response.status})`;
    throw new Error(message);
  }

  return body;
}

function getYoutubeNetwork(profile) {
  const networks = Array.isArray(profile.reseaux) ? profile.reseaux : [];

  return networks.find((network) => {
    const type = String(network?.type || "").toLowerCase();
    const link = String(network?.lien || network?.url || "");
    return type.includes("youtube") || /youtube\.com|youtu\.be/i.test(link);
  });
}

function parseChannelReference(link) {
  try {
    const url = new URL(/^https?:\/\//i.test(link) ? link : `https://${link}`);
    const parts = url.pathname.split("/").filter(Boolean);

    const channelIndex = parts.findIndex((part) => part.toLowerCase() === "channel");
    if (channelIndex >= 0 && parts[channelIndex + 1]) {
      return { channelId: parts[channelIndex + 1] };
    }

    const userIndex = parts.findIndex((part) => part.toLowerCase() === "user");
    if (userIndex >= 0 && parts[userIndex + 1]) {
      return { username: parts[userIndex + 1] };
    }

    const handlePart = parts.find((part) => part.startsWith("@"));
    if (handlePart) {
      return { handle: handlePart.slice(1) };
    }
  } catch {
    // Lien YouTube invalide : le profil sera simplement ignoré pour la détection.
  }

  return null;
}

async function resolveChannelId(reference) {
  if (reference.channelId) return reference.channelId;

  let result;
  if (reference.handle) {
    result = await youtubeApi("channels", {
      part: "id",
      forHandle: reference.handle,
      maxResults: 1
    });
  } else if (reference.username) {
    result = await youtubeApi("channels", {
      part: "id",
      forUsername: reference.username,
      maxResults: 1
    });
  }

  return result?.items?.[0]?.id || null;
}

async function main() {
  console.log("Chargement des profils Firebase…");

  const profilesSnapshot = await db.collection("users").get();
  const profiles = [];

  for (const profileDoc of profilesSnapshot.docs) {
    const profile = profileDoc.data();
    const network = getYoutubeNetwork(profile);
    const link = network ? String(network.lien || network.url || "") : "";
    const reference = link ? parseChannelReference(link) : null;

    let channelId = null;
    if (reference) {
      try {
        channelId = await resolveChannelId(reference);
      } catch (error) {
        console.warn(`Impossible de résoudre la chaîne du profil ${profile.pseudo || profileDoc.id} : ${error.message}`);
      }
    }

    profiles.push({
      id: profileDoc.id,
      pseudo: String(profile.pseudo || "Créateur"),
      channelId
    });
  }

  const knownChannels = new Set(
    profiles.map((profile) => profile.channelId).filter(Boolean)
  );

  console.log(`${profiles.length} profil(s) chargé(s), ${knownChannels.size} chaîne(s) YouTube identifiée(s).`);

  let liveByChannel = new Map();

  if (knownChannels.size > 0) {
    // Une recherche globale limite fortement l'utilisation du quota YouTube gratuit.
    // L'API ne renvoie que les directs présents dans ses résultats (maximum 50 ici).
    const liveSearch = await youtubeApi("search", {
      part: "snippet",
      type: "video",
      eventType: "live",
      maxResults: 50,
      order: "date"
    });

    for (const item of liveSearch.items || []) {
      const channelId = item.snippet?.channelId;
      const videoId = item.id?.videoId;

      if (!channelId || !videoId || !knownChannels.has(channelId)) continue;

      liveByChannel.set(channelId, {
        videoId,
        liveUrl: `https://www.youtube.com/watch?v=${videoId}`,
        thumbnail:
          item.snippet?.thumbnails?.high?.url ||
          item.snippet?.thumbnails?.medium?.url ||
          item.snippet?.thumbnails?.default?.url ||
          "",
        title: item.snippet?.title || ""
      });
    }
  }

  const batch = db.batch();
  const checkedAt = admin.firestore.FieldValue.serverTimestamp();

  for (const profile of profiles) {
    const live = profile.channelId ? liveByChannel.get(profile.channelId) : null;
    const ref = db.collection("youtubeLiveCache").doc(profile.id);

    batch.set(ref, {
      pseudo: profile.pseudo,
      channelId: profile.channelId || "",
      isLive: Boolean(live),
      liveUrl: live?.liveUrl || "",
      thumbnail: live?.thumbnail || "",
      videoId: live?.videoId || "",
      title: live?.title || "",
      checkedAt
    }, { merge: true });
  }

  await batch.commit();

  const detected = profiles.filter((profile) => profile.channelId && liveByChannel.has(profile.channelId));
  console.log(`Terminé : ${detected.length} direct(s) détecté(s) sur ${profiles.length} profil(s).`);
  console.log("Les profils non détectés sont marqués hors direct.");
}

main().catch((error) => {
  console.error("Échec de la vérification des directs :", error.message);
  process.exitCode = 1;
});
