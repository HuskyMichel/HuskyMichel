
import { db } from "./firebase.js";
import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const listeClassement = document.getElementById("listeClassement");
const nombreProfils = document.getElementById("nombreProfils");

function obtenirPosition(position) {
    if (position === 1) return "🥇 1er";
    if (position === 2) return "🥈 2e";
    if (position === 3) return "🥉 3e";
    return position + "e";
}

function creerLigne(profil, position) {
    const ligne = document.createElement("div");
    ligne.className = "ligneClassement";

    if (position <= 3) {
        ligne.classList.add("topTrois");

        if (position === 1) ligne.classList.add("premier");
        if (position === 2) ligne.classList.add("deuxieme");
        if (position === 3) ligne.classList.add("troisieme");
    }

    const numero = document.createElement("div");
    numero.className = "positionClassement";
    numero.textContent = obtenirPosition(position);

    const image = document.createElement("img");
    image.className = "photoClassement";
    image.src = profil.photo || "Photo de profil/Accueil.jpg";
    image.alt = profil.pseudo;

    image.onerror = () => {
        image.src = "Photo de profil/Accueil.jpg";
    };

    const informations = document.createElement("div");
    informations.className = "infosClassement";

    const pseudo = document.createElement("div");
    pseudo.className = "pseudoClassement";
    pseudo.textContent = profil.pseudo;

    const sousTitre = document.createElement("div");
    sousTitre.className = "sousTitreClassement";

    if (position === 1) {
        sousTitre.textContent = "🏆 Meilleur classement";
    } else if (position === 2) {
        sousTitre.textContent = "✨ Deuxième place";
    } else if (position === 3) {
        sousTitre.textContent = "⭐ Troisième place";
    } else {
        sousTitre.textContent = "Position dans le classement";
    }

    informations.append(pseudo, sousTitre);

    const likes = document.createElement("div");
    likes.className = "nombreLikes";
    likes.textContent = "❤️ " + profil.likes;

    ligne.append(numero, image, informations, likes);

    ligne.addEventListener("click", () => {
        window.location.href =
            "profil.html?pseudo=" + encodeURIComponent(profil.pseudo);
    });

    return ligne;
}

async function chargerClassementLikes() {
    try {
        listeClassement.innerHTML =
            `<p class="messageClassement">Chargement du classement...</p>`;

        const profilsSnapshot = await getDocs(
            collection(db, "users")
        );

        const lecturesLikes = profilsSnapshot.docs.map(
            async (profilDoc) => {
                const data = profilDoc.data();
                const pseudo = data.pseudo || "";

                if (!pseudo) return null;

                const likesSnapshot = await getDocs(
                    collection(db, "users", pseudo, "likes")
                );

                return {
                    pseudo: pseudo,
                    photo: data.photo || "",
                    likes: likesSnapshot.size
                };
            }
        );

        const resultats = await Promise.all(lecturesLikes);

        const classement = resultats
            .filter(profil => profil !== null)
            .sort((a, b) => b.likes - a.likes);

        nombreProfils.textContent =
            classement.length +
            (classement.length > 1 ? " profils" : " profil");

        listeClassement.innerHTML = "";

        if (classement.length === 0) {
            listeClassement.innerHTML =
                `<p class="messageClassement">Aucun profil à afficher pour le moment.</p>`;
            return;
        }

        classement.forEach((profil, index) => {
            listeClassement.appendChild(
                creerLigne(profil, index + 1)
            );
        });

    } catch (error) {
        console.error("Erreur classement likes :", error);

        listeClassement.innerHTML =
            `<p class="messageClassement">Impossible de charger le classement. Vérifie les règles de sécurité Firebase.</p>`;
    }
}

chargerClassementLikes();
