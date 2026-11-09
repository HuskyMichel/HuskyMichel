

"use strict";

// ========================================
// GAMING - HUSKYMICHEL
// ========================================

import { auth, db } from "./firebase.js";

import {
    GoogleAuthProvider,
    signInWithPopup,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

import {
    collection,
    getDocs,
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

// ========================================
// ELEMENTS HTML
// ========================================

const listeJeux = document.getElementById("listeJeux");
const rechercheJeu = document.getElementById("rechercheJeu");
const aucunJeuTrouve = document.getElementById("aucunJeuTrouve");

const loginBtn = document.getElementById("loginBtn");
const profile = document.getElementById("profile");
const avatar = document.getElementById("avatar");
const menu = document.getElementById("menu");

const monProfil = document.getElementById("monProfil");
const changePhoto = document.getElementById("changePhoto");
const logout = document.getElementById("logout");

// ========================================
// DONNÉES
// ========================================

let jeux = [];
let utilisateurActuel = null;

// ========================================
// CONFIGURATION DES JEUX
// ========================================

// Les noms doivent correspondre aux catégories
// enregistrées dans les profils Firebase.

const CONFIGURATION_JEUX = {
    "clash royale": {
        image: "Images Gaming/clash-royal.jpg",
        page: "clash-royal.html"
    },

    "fortnite": {
        image: "Images Gaming/fortnite.jpg",
        page: "fortnite.html"
    },

    "minecraft": {
        image: "Images Gaming/minecraft.jpg",
        page: "minecraft.html"
    },

    "brawl stars": {
        image: "Images Gaming/brawl-stars.jpg",
        page: "brawl-stars.html"
    },

    "roblox": {
        image: "Images Gaming/roblox.jpg",
        page: "roblox.html"
    },

    "gta 5": {
        image: "Images Gaming/gta-5.jpg",
        page: "gta-5.html"
    },

    "gta v": {
        image: "Images Gaming/gta-5.jpg",
        page: "gta-5.html"
    },

    "rocket league": {
        image: "Images Gaming/rocket-league.jpg",
        page: "rocket-league.html"
    },

    "valorant": {
        image: "Images Gaming/valorant.jpg",
        page: "valorant.html"
    },

    "call of duty": {
        image: "Images Gaming/call-of-duty.jpg",
        page: "call-of-duty.html"
    },

    "league of legends": {
        image: "Images Gaming/league-of-legends.jpg",
        page: "league-of-legends.html"
    },

    "among us": {
        image: "Images Gaming/among-us.jpg",
        page: "among-us.html"
    }
};

// ========================================
// OUTILS
// ========================================

function normaliserNom(nom) {
    return String(nom || "")
        .trim()
        .toLocaleLowerCase("fr");
}

function echapperHTML(texte) {
    return String(texte ?? "").replace(/[&<>"']/g, caractere => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[caractere]);
}

function obtenirConfiguration(nomJeu) {
    const cle = normaliserNom(nomJeu);

    if (CONFIGURATION_JEUX[cle]) {
        return CONFIGURATION_JEUX[cle];
    }

    // Configuration automatique pour les jeux non listés.

    const slug = cle
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

    return {
        image: `Images Gaming/${slug}.jpg`,
        page: `${slug}.html`
    };
}

// ========================================
// CHARGEMENT DES JEUX DEPUIS FIREBASE
// ========================================

async function chargerJeux() {
    listeJeux.innerHTML = `
        <div class="gaming-chargement">
            Chargement des jeux...
        </div>
    `;

    try {
        const snapshot = await getDocs(collection(db, "users"));

        const groupes = new Map();

        snapshot.forEach(documentProfil => {
            const data = documentProfil.data();

            // Récupération des catégories du profil.

            const categories = Array.isArray(data.categories)
                ? data.categories
                    .filter(categorie => typeof categorie === "string")
                    .map(categorie => categorie.trim())
                    .filter(Boolean)
                : [];

            // IMPORTANT :
            // Un profil compte uniquement s'il possède
            // exactement une catégorie.

            if (categories.length !== 1) {
                return;
            }

            const nomJeu = categories[0];
            const cle = normaliserNom(nomJeu);

            if (!cle) {
                return;
            }

            if (!groupes.has(cle)) {
                groupes.set(cle, {
                    nom: nomJeu,
                    nombre: 0
                });
            }

            groupes.get(cle).nombre++;
        });

        // Création de la liste et tri décroissant.

        jeux = Array.from(groupes.values())
            .sort((a, b) => {
                if (b.nombre !== a.nombre) {
                    return b.nombre - a.nombre;
                }

                return a.nom.localeCompare(b.nom, "fr");
            });

        afficherJeux();

    } catch (erreur) {
        console.error("Erreur de chargement des jeux :", erreur);

        listeJeux.innerHTML = `
            <p class="gaming-message-vide">
                Impossible de charger les jeux pour le moment.
            </p>
        `;
    }
}

// ========================================
// AFFICHAGE DES CARTES DE JEUX
// ========================================

function afficherJeux() {
    const recherche = normaliserNom(rechercheJeu.value);

    const jeuxFiltres = jeux.filter(jeu =>
        normaliserNom(jeu.nom).includes(recherche)
    );

    listeJeux.innerHTML = "";

    aucunJeuTrouve.hidden = jeuxFiltres.length !== 0;

    if (jeuxFiltres.length === 0) {
        return;
    }

    jeuxFiltres.forEach(jeu => {
        const configuration = obtenirConfiguration(jeu.nom);

        const carte = document.createElement("a");

        carte.className = "carte-jeu";
        carte.href = configuration.page;

        carte.setAttribute(
            "aria-label",
            `Voir les profils de ${jeu.nom}`
        );

        const image = document.createElement("img");

        image.className = "image-jeu";
        image.src = configuration.image;
        image.alt = jeu.nom;
        image.loading = "lazy";

        // Si l'image n'existe pas, on conserve
        // le fond de remplacement sans afficher d'émoji.

        image.addEventListener("error", () => {
            image.classList.add("image-indisponible");
        });

        const infos = document.createElement("div");
        infos.className = "infos-jeu";

        const titre = document.createElement("h2");
        titre.textContent = jeu.nom;

        const nombre = document.createElement("p");
        nombre.textContent =
            `${jeu.nombre} ${jeu.nombre > 1 ? "profils" : "profil"}`;

        infos.append(titre, nombre);
        carte.append(image, infos);

        listeJeux.appendChild(carte);
    });
}

// ========================================
// RECHERCHE DES JEUX
// ========================================

rechercheJeu.addEventListener("input", afficherJeux);

// ========================================
// CONNEXION GOOGLE
// ========================================

const provider = new GoogleAuthProvider();

provider.setCustomParameters({
    prompt: "select_account"
});

loginBtn.addEventListener("click", async () => {
    try {
        await signInWithPopup(auth, provider);
    } catch (erreur) {
        console.error("Erreur de connexion :", erreur);
    }
});

// ========================================
// MENU DU COMPTE
// ========================================

avatar.addEventListener("click", evenement => {
    evenement.stopPropagation();

    menu.style.display =
        menu.style.display === "block"
            ? "none"
            : "block";
});

document.addEventListener("click", evenement => {
    if (!profile.contains(evenement.target)) {
        menu.style.display = "none";
    }
});

// ========================================
// MON PROFIL
// ========================================

monProfil.addEventListener("click", async evenement => {
    evenement.preventDefault();

    if (!utilisateurActuel) {
        return;
    }

    try {
        const profilRef = doc(
            db,
            "users",
            utilisateurActuel.uid
        );

        const profilSnap = await getDoc(profilRef);

        if (!profilSnap.exists()) {
            window.location.href = "creation-profil.html";
            return;
        }

        const data = profilSnap.data();

        if (!data.pseudo) {
            return;
        }

        window.location.href =
            "profil.html?pseudo=" +
            encodeURIComponent(data.pseudo);

    } catch (erreur) {
        console.error("Erreur lors de l'ouverture du profil :", erreur);
    }
});

// ========================================
// CHANGER LA PHOTO
// ========================================

changePhoto.addEventListener("click", evenement => {
    evenement.preventDefault();

    if (!utilisateurActuel) {
        return;
    }

    window.location.href = "creation-profil.html";
});

// ========================================
// DÉCONNEXION
// ========================================

logout.addEventListener("click", async () => {
    try {
        await signOut(auth);
    } catch (erreur) {
        console.error("Erreur de déconnexion :", erreur);
    }
});

// ========================================
// ÉTAT DE CONNEXION
// ========================================

onAuthStateChanged(auth, async user => {
    utilisateurActuel = user;

    if (user) {
        // Photo Google.

        if (user.photoURL) {
            avatar.src = user.photoURL.replace(
                "=s96-c",
                "=s512-c"
            );
        } else {
            avatar.src = "Photo de profil/Accueil.jpg";
        }

        loginBtn.style.display = "none";
        profile.style.display = "block";

        // Vérifier que l'utilisateur possède un profil.

        try {
            const profilRef = doc(db, "users", user.uid);
            const profilSnap = await getDoc(profilRef);

            if (!profilSnap.exists()) {
                window.location.href = "creation-profil.html";
                return;
            }

        } catch (erreur) {
            console.error(
                "Erreur lors de la vérification du profil :",
                erreur
            );
        }

    } else {
        loginBtn.style.display = "block";
        profile.style.display = "none";
        menu.style.display = "none";
    }
});

// ========================================
// DÉMARRAGE
// ========================================

chargerJeux();

