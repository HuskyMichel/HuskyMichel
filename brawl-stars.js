
"use strict";

// ========================================
// BRAWL STARS - HUSKYMICHEL
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
// ELEMENTS
// ========================================

const listeProfils = document.getElementById("listeProfils");
const rechercheProfil = document.getElementById("rechercheProfil");
const nombreProfils = document.getElementById("nombreProfils");
const aucunProfil = document.getElementById("aucunProfil");

const loginBtn = document.getElementById("loginBtn");
const profile = document.getElementById("profile");
const avatar = document.getElementById("avatar");
const menu = document.getElementById("menu");

const monProfil = document.getElementById("monProfil");
const changePhoto = document.getElementById("changePhoto");
const logout = document.getElementById("logout");

let utilisateurActuel = null;
let profils = [];

// ========================================
// OUTILS
// ========================================

function normaliserNom(nom) {
    return String(nom || "").trim().toLocaleLowerCase("fr");
}

// ========================================
// CHARGEMENT DES PROFILS
// ========================================

async function chargerProfils() {

    listeProfils.innerHTML = `
        <p class="message-chargement">
            Chargement des profils...
        </p>
    `;

    try {

        const snapshot = await getDocs(collection(db, "users"));

        profils = [];

        snapshot.forEach(documentProfil => {

            const data = documentProfil.data();

            const categories = Array.isArray(data.categories)
                ? data.categories
                    .filter(categorie => typeof categorie === "string")
                    .map(categorie => categorie.trim())
                    .filter(Boolean)
                : [];

            // Uniquement les profils ayant exactement
            // Brawl Stars comme seule catégorie.

            if (
                categories.length !== 1 ||
                normaliserNom(categories[0]) !== "brawl stars"
            ) {
                return;
            }

            profils.push({
                id: documentProfil.id,
                pseudo: data.pseudo || "Profil sans pseudo",
                photo: data.photo || "Photo de profil/Accueil.jpg",
                description: data.descriptionCourte || ""
            });

        });

        afficherProfils();

    } catch (erreur) {

        console.error("Erreur de chargement des profils :", erreur);

        listeProfils.innerHTML = `
            <p class="message-chargement">
                Impossible de charger les profils.
            </p>
        `;

        nombreProfils.textContent = "Erreur de chargement";

    }
}

// ========================================
// AFFICHAGE DES PROFILS
// ========================================

function afficherProfils() {

    const recherche = normaliserNom(rechercheProfil.value);

    const profilsFiltres = profils.filter(profil =>
        normaliserNom(profil.pseudo).includes(recherche)
    );

    nombreProfils.textContent =
        `${profils.length} ${profils.length > 1 ? "profils" : "profil"} trouvé${profils.length > 1 ? "s" : ""}`;

    listeProfils.innerHTML = "";

    aucunProfil.hidden = profilsFiltres.length !== 0;

    profilsFiltres.forEach(profil => {

        const carte = document.createElement("article");
        carte.className = "carte-brawl";

        const photo = document.createElement("img");
        photo.className = "brawl-photo";
        photo.src = profil.photo;
        photo.alt = `Photo de ${profil.pseudo}`;

        photo.onerror = () => {
            photo.src = "Photo de profil/Accueil.jpg";
        };

        const infos = document.createElement("div");
        infos.className = "brawl-infos";

        const pseudo = document.createElement("h2");
        pseudo.textContent = profil.pseudo;

        const description = document.createElement("p");
        description.className = "brawl-description";
        description.textContent = profil.description;

        const bouton = document.createElement("a");
        bouton.className = "bouton-profil-brawl";
        bouton.textContent = "Voir le profil";
        bouton.href =
            "profil.html?pseudo=" + encodeURIComponent(profil.pseudo);

        infos.append(pseudo, description, bouton);
        carte.append(photo, infos);

        listeProfils.appendChild(carte);

    });
}

// ========================================
// RECHERCHE
// ========================================

rechercheProfil.addEventListener("input", afficherProfils);

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
        menu.style.display === "block" ? "none" : "block";

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

    if (!utilisateurActuel) return;

    try {

        const profilRef = doc(db, "users", utilisateurActuel.uid);
        const profilSnap = await getDoc(profilRef);

        if (!profilSnap.exists()) {
            window.location.href = "creation-profil.html";
            return;
        }

        const data = profilSnap.data();

        if (data.pseudo) {
            window.location.href =
                "profil.html?pseudo=" + encodeURIComponent(data.pseudo);
        }

    } catch (erreur) {
        console.error("Erreur lors de l'ouverture du profil :", erreur);
    }

});

// ========================================
// CHANGER LA PHOTO
// ========================================

changePhoto.addEventListener("click", () => {
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

        loginBtn.style.display = "none";
        profile.style.display = "block";

        try {

            const profilRef = doc(db, "users", user.uid);
            const profilSnap = await getDoc(profilRef);

            if (!profilSnap.exists()) {
                window.location.href = "creation-profil.html";
                return;
            }

            const data = profilSnap.data();

            avatar.src =
                data.photo ||
                user.photoURL ||
                "Photo de profil/Accueil.jpg";

        } catch (erreur) {

            console.error("Erreur de récupération du compte :", erreur);

            avatar.src =
                user.photoURL || "Photo de profil/Accueil.jpg";

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

chargerProfils();
