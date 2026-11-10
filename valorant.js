
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
// VALORANT — HUSKYMICHEL
// ========================================

const provider = new GoogleAuthProvider();

const loginBtn = document.getElementById("loginBtn");
const profile = document.getElementById("profile");
const avatar = document.getElementById("avatar");
const menu = document.getElementById("menu");
const logoutBtn = document.getElementById("logout");
const changePhotoBtn = document.getElementById("changePhoto");
const monProfil = document.getElementById("monProfil");

const rechercheProfil = document.getElementById("rechercheProfil");
const listeProfils = document.getElementById("listeProfils");
const nombreProfils = document.getElementById("nombreProfils");
const aucunProfilTrouve = document.getElementById("aucunProfilTrouve");

let tousLesProfils = [];

// ========================================
// CONNEXION
// ========================================

loginBtn.addEventListener("click", async () => {
    try {
        await signInWithPopup(auth, provider);
    } catch (error) {
        console.error("Erreur de connexion :", error);
        alert("Impossible de se connecter.");
    }
});

logoutBtn.addEventListener("click", async () => {
    try {
        await signOut(auth);
        menu.style.display = "none";
    } catch (error) {
        console.error("Erreur de déconnexion :", error);
    }
});

avatar.addEventListener("click", () => {
    menu.style.display =
        menu.style.display === "block" ? "none" : "block";
});

document.addEventListener("click", (event) => {
    if (!profile.contains(event.target)) {
        menu.style.display = "none";
    }
});

// ========================================
// PHOTO DE PROFIL
// ========================================

changePhotoBtn.addEventListener("click", () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";

    input.addEventListener("change", () => {
        const file = input.files[0];

        if (!file) return;

        const reader = new FileReader();

        reader.onload = () => {
            avatar.src = reader.result;
        };

        reader.readAsDataURL(file);
    });

    input.click();
});

// ========================================
// PROFIL PERSONNEL
// ========================================

monProfil.addEventListener("click", async (event) => {
    event.preventDefault();

    const user = auth.currentUser;
    if (!user) return;

    try {
        const userDoc = await getDoc(doc(db, "users", user.uid));

        if (userDoc.exists()) {
            const data = userDoc.data();

            if (data.pseudo) {
                window.location.href =
                    `profil.html?pseudo=${encodeURIComponent(data.pseudo)}`;
            }
        }
    } catch (error) {
        console.error("Erreur :", error);
    }
});

// ========================================
// ÉTAT DE CONNEXION
// ========================================

onAuthStateChanged(auth, async (user) => {
    if (user) {
        loginBtn.style.display = "none";
        profile.style.display = "block";

        avatar.src = user.photoURL || "Photo de profil/Accueil.jpg";

        try {
            const userDoc = await getDoc(doc(db, "users", user.uid));

            if (!userDoc.exists()) {
                window.location.href = "creation-profil.html";
                return;
            }

            const data = userDoc.data();

            if (data.photo) {
                avatar.src = data.photo;
            }
        } catch (error) {
            console.error("Erreur de récupération du profil :", error);
        }
    } else {
        loginBtn.style.display = "block";
        profile.style.display = "none";
    }
});

// ========================================
// CHARGEMENT DES PROFILS VALORANT
// ========================================

async function chargerProfils() {
    try {
        const snapshot = await getDocs(collection(db, "users"));

        tousLesProfils = [];

        snapshot.forEach((document) => {
            const data = document.data();

            if (!Array.isArray(data.categories)) return;

            const categories = data.categories
                .filter(categorie => typeof categorie === "string")
                .map(categorie => categorie.trim())
                .filter(categorie => categorie.length > 0);

            // Une seule catégorie exactement
            if (categories.length !== 1) return;

            if (categories[0].toLowerCase() !== "valorant") return;

            if (!data.pseudo) return;

            tousLesProfils.push({
                pseudo: data.pseudo,
                photo: data.photo || "Photo de profil/Accueil.jpg",
                description: data.descriptionCourte || ""
            });
        });

        afficherProfils(tousLesProfils);

    } catch (error) {
        console.error("Erreur de chargement des profils :", error);

        listeProfils.innerHTML =
            '<div class="valorant-chargement">Erreur lors du chargement des profils.</div>';

        nombreProfils.textContent = "Impossible de charger les profils.";
    }
}

// ========================================
// AFFICHAGE DES PROFILS
// ========================================

function afficherProfils(profils) {
    listeProfils.innerHTML = "";

    nombreProfils.textContent =
        `${profils.length} profil${profils.length > 1 ? "s" : ""}`;

    aucunProfilTrouve.hidden = profils.length !== 0;

    profils.forEach((profil) => {
        const carte = document.createElement("a");

        carte.className = "carte-profil-valorant";
        carte.href =
            `profil.html?pseudo=${encodeURIComponent(profil.pseudo)}`;

        const image = document.createElement("img");
        image.className = "photo-profil-valorant";
        image.src = profil.photo;
        image.alt = profil.pseudo;

        image.onerror = () => {
            image.src = "Photo de profil/Accueil.jpg";
        };

        const infos = document.createElement("div");
        infos.className = "infos-profil-valorant";

        const pseudo = document.createElement("h2");
        pseudo.textContent = profil.pseudo;

        const description = document.createElement("p");
        description.textContent = profil.description;

        infos.appendChild(pseudo);
        infos.appendChild(description);

        carte.appendChild(image);
        carte.appendChild(infos);

        listeProfils.appendChild(carte);
    });
}

// ========================================
// RECHERCHE
// ========================================

rechercheProfil.addEventListener("input", () => {
    const recherche = rechercheProfil.value
        .trim()
        .toLowerCase();

    const resultats = tousLesProfils.filter((profil) =>
        profil.pseudo.toLowerCase().includes(recherche)
    );

    afficherProfils(resultats);
});

// ========================================
// LANCEMENT
// ========================================

chargerProfils();
