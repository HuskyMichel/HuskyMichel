
import { db } from "./firebase.js";
import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const listeClassement = document.getElementById("listeClassement");
const nombreProfils = document.getElementById("nombreProfils");

function obtenirMedaille(position) {
    if (position === 1) return "🥇";
    if (position === 2) return "🥈";
    if (position === 3) return "🥉";
    return position + "e";
}

function creerPhoto(url, pseudo, classe) {
    const image = document.createElement("img");
    image.className = classe;
    image.alt = pseudo;
    image.src = url || "Photo de profil/Accueil.jpg";

    image.onerror = () => {
        image.src = "Photo de profil/Accueil.jpg";
    };

    return image;
}

function ouvrirProfil(pseudo) {
    window.location.href =
        "profil.html?pseudo=" + encodeURIComponent(pseudo);
}

function creerPodium(profil, position) {
    const carte = document.createElement("div");
    carte.className = "cartePodium";

    if (position === 1) carte.classList.add("premier");
    if (position === 2) carte.classList.add("deuxieme");
    if (position === 3) carte.classList.add("troisieme");

    const medaille = document.createElement("span");
    medaille.className = "medaillePodium";
    medaille.textContent = obtenirMedaille(position);

    const image = creerPhoto(
        profil.photo,
        profil.pseudo,
        "photoPodium"
    );

    const pseudo = document.createElement("div");
    pseudo.className = "pseudoPodium";
    pseudo.textContent = profil.pseudo;

    const likes = document.createElement("div");
    likes.className = "likesPodium";
    likes.textContent = "❤️ " + profil.likes + " likes";

    const rang = document.createElement("span");
    rang.className = "positionPodium";
    rang.textContent = position === 1
        ? "CHAMPION"
        : "TOP " + position;

    carte.append(
        medaille,
        image,
        pseudo,
        likes,
        rang
    );

    carte.addEventListener("click", () => {
        ouvrirProfil(profil.pseudo);
    });

    return carte;
}

function creerLigne(profil, position) {
    const ligne = document.createElement("div");
    ligne.className = "ligneClassement";

    const numero = document.createElement("div");
    numero.className = "positionClassement";
    numero.textContent = obtenirMedaille(position);

    const image = creerPhoto(
        profil.photo,
        profil.pseudo,
        "photoClassement"
    );

    const informations = document.createElement("div");
    informations.className = "infosClassement";

    const pseudo = document.createElement("div");
    pseudo.className = "pseudoClassement";
    pseudo.textContent = profil.pseudo;

    const sousTitre = document.createElement("div");
    sousTitre.className = "sousTitreClassement";
    sousTitre.textContent = "Position : " + position;

    informations.append(pseudo, sousTitre);

    const likes = document.createElement("div");
    likes.className = "nombreLikes";
    likes.textContent = "❤️ " + profil.likes;

    ligne.append(
        numero,
        image,
        informations,
        likes
    );

    ligne.addEventListener("click", () => {
        ouvrirProfil(profil.pseudo);
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
                    pseudo,
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

        // PODIUM DES TROIS PREMIERS

        const podium = document.createElement("div");
        podium.className = "podiumClassement";

        // Ordre visuel : deuxième, premier, troisième
        const ordrePodium = [
            { index: 1, position: 2 },
            { index: 0, position: 1 },
            { index: 2, position: 3 }
        ];

        ordrePodium.forEach(item => {
            if (classement[item.index]) {
                podium.appendChild(
                    creerPodium(
                        classement[item.index],
                        item.position
                    )
                );
            }
        });

        if (classement.length > 0) {
            listeClassement.appendChild(podium);
        }

        // AUTRES POSITIONS

        if (classement.length > 3) {
            const titre = document.createElement("h3");
            titre.className = "titreAutres";
            titre.textContent = "Les autres positions";

            listeClassement.appendChild(titre);

            classement.slice(3).forEach((profil, index) => {
                listeClassement.appendChild(
                    creerLigne(profil, index + 4)
                );
            });
        }

    } catch (error) {
        console.error(
            "Erreur lors du chargement du classement des likes :",
            error
        );

        listeClassement.innerHTML =
            `<p class="messageClassement">Impossible de charger le classement. Vérifie les règles de sécurité Firebase.</p>`;
    }
}

chargerClassementLikes();
