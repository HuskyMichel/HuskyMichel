
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

    // Mise en valeur des trois premiers
    if (position <= 3) {
        ligne.classList.add("topTrois");

        if (position === 1) ligne.classList.add("premier");
        if (position === 2) ligne.classList.add("deuxieme");
        if (position === 3) ligne.classList.add("troisieme");
    }

    // Position
    const numero = document.createElement("div");
    numero.className = "positionClassement";
    numero.textContent = obtenirPosition(position);

    // Photo
    const image = document.createElement("img");
    image.className = "photoClassement";
    image.src = profil.photo || "Photo de profil/Accueil.jpg";
    image.alt = profil.pseudo;

    image.onerror = () => {
        image.src = "Photo de profil/Accueil.jpg";
    };

    // Informations
    const informations = document.createElement("div");
    informations.className = "infosClassement";

    const pseudo = document.createElement("div");
    pseudo.className = "pseudoClassement";
    pseudo.textContent = profil.pseudo;

    const sousTitre = document.createElement("div");
    sousTitre.className = "sousTitreClassement";

    if (position === 1) {
        sousTitre.textContent = "🏆 Profil le plus consulté";
    } else if (position === 2) {
        sousTitre.textContent = "✨ Deuxième place";
    } else if (position === 3) {
        sousTitre.textContent = "⭐ Troisième place";
    } else {
        sousTitre.textContent = "Position dans le classement";
    }

    informations.append(pseudo, sousTitre);

    // Nombre de vues
    const vues = document.createElement("div");
    vues.className = "nombreLikes";
    vues.textContent = "👁️ " + profil.vues;

    // Assemblage
    ligne.append(
        numero,
        image,
        informations,
        vues
    );

    // Ouverture du profil
    ligne.addEventListener("click", () => {
        window.location.href =
            "profil.html?pseudo=" + encodeURIComponent(profil.pseudo);
    });

    return ligne;
}

async function chargerClassementVues() {
    try {
        listeClassement.innerHTML =
            `<p class="messageClassement">Chargement du classement...</p>`;

        // Récupération des profils
        const profilsSnapshot = await getDocs(
            collection(db, "users")
        );

        // Récupération des vues de chaque profil
        const lecturesVues = profilsSnapshot.docs.map(
            async (profilDoc) => {
                const data = profilDoc.data();
                const pseudo = data.pseudo || "";

                if (!pseudo) return null;

                // IMPORTANT :
                // Les vues sont enregistrées sous l'ID du document
                // Firestore du profil, et non sous son pseudo.
                const vuesSnapshot = await getDocs(
                    collection(db, "users", profilDoc.id, "vues")
                );

                return {
                    pseudo: pseudo,
                    photo: data.photo || "",
                    vues: vuesSnapshot.size
                };
            }
        );

        const resultats = await Promise.all(lecturesVues);

        // Tri décroissant : plus de vues = meilleure position
        const classement = resultats
            .filter(profil => profil !== null)
            .sort((a, b) => b.vues - a.vues);

        // Nombre de profils
        nombreProfils.textContent =
            classement.length +
            (classement.length > 1 ? " profils" : " profil");

        listeClassement.innerHTML = "";

        if (classement.length === 0) {
            listeClassement.innerHTML =
                `<p class="messageClassement">
                    Aucun profil à afficher pour le moment.
                </p>`;
            return;
        }

        // Affichage de tous les profils
        classement.forEach((profil, index) => {
            listeClassement.appendChild(
                creerLigne(profil, index + 1)
            );
        });

    } catch (error) {
        console.error(
            "Erreur lors du chargement du classement des vues :",
            error
        );

        listeClassement.innerHTML =
            `<p class="messageClassement">
                Impossible de charger le classement.
                Vérifie les règles de sécurité Firebase.
            </p>`;
    }
}

chargerClassementVues();
