"use strict";

// ========================================
// CLASH ROYALE - HUSKYMICHEL
// Cartes identiques à index.html
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
    getDoc,
    setDoc,
    deleteDoc
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

function creerElement(tag, classe, texte = "") {
    const element = document.createElement(tag);

    if (classe) {
        element.className = classe;
    }

    if (texte !== "") {
        element.textContent = texte;
    }

    return element;
}

// ========================================
// ANIMATION DES LIKES
// ========================================

function lancerAnimationCoeurs(carte) {
    if (!carte) return;

    carte.classList.add("animationLike");

    for (let i = 0; i < 18; i++) {
        const coeur = creerElement("div", "coeurAnimation", "❤️");

        coeur.style.left = (10 + Math.random() * 80) + "%";
        coeur.style.bottom = (10 + Math.random() * 20) + "px";
        coeur.style.fontSize = (25 + Math.random() * 25) + "px";
        coeur.style.animationDelay = (Math.random() * 0.35) + "s";

        carte.appendChild(coeur);

        setTimeout(() => coeur.remove(), 1500);
    }

    setTimeout(() => {
        carte.classList.remove("animationLike");
    }, 1100);
}

function animerBoutonLike(bouton) {
    bouton.classList.add("likeClick");

    setTimeout(() => {
        bouton.classList.remove("likeClick");
    }, 250);
}

// ========================================
// LIKES
// ========================================

async function chargerLikes(pseudo, bouton, compteur) {
    try {
        const likesRef = collection(db, "users", pseudo, "likes");
        const snapshot = await getDocs(likesRef);

        const nombre = snapshot.size;

        compteur.dataset.likes = nombre;
        compteur.textContent =
            `❤️ ${nombre} ${nombre > 1 ? "likes" : "like"}`;

        if (utilisateurActuel) {
            const monLikeRef = doc(
                db,
                "users",
                pseudo,
                "likes",
                utilisateurActuel.uid
            );

            const monLikeSnap = await getDoc(monLikeRef);

            bouton.classList.toggle("liked", monLikeSnap.exists());
            bouton.textContent = monLikeSnap.exists()
                ? "♥ J'aime"
                : "♡ J'aime";
        }

    } catch (erreur) {
        console.error("Erreur lors du chargement des likes :", erreur);
    }
}

async function gererLike(pseudo, bouton, compteur, carte) {
    if (!utilisateurActuel) {
        alert("Tu dois être connecté pour aimer un profil ❤️");
        return;
    }

    if (bouton.dataset.chargement === "true") return;

    bouton.dataset.chargement = "true";

    try {
        const likeRef = doc(
            db,
            "users",
            pseudo,
            "likes",
            utilisateurActuel.uid
        );

        const likeSnap = await getDoc(likeRef);

        let nombre = parseInt(compteur.dataset.likes || "0", 10);

        if (likeSnap.exists()) {
            await deleteDoc(likeRef);

            bouton.classList.remove("liked");
            bouton.textContent = "♡ J'aime";

            nombre = Math.max(0, nombre - 1);

        } else {
            await setDoc(likeRef, {
                uid: utilisateurActuel.uid,
                date: new Date()
            });

            bouton.classList.add("liked");
            bouton.textContent = "♥ J'aime";

            nombre++;

            animerBoutonLike(bouton);
            lancerAnimationCoeurs(carte);
        }

        compteur.dataset.likes = nombre;
        compteur.textContent =
            `❤️ ${nombre} ${nombre > 1 ? "likes" : "like"}`;

    } catch (erreur) {
        console.error("Erreur lors du like :", erreur);
    }

    bouton.dataset.chargement = "false";
}

// ========================================
// VUES
// ========================================

async function chargerVues(profilId, compteurVues) {
    if (!profilId || !compteurVues) return;

    try {
        const vuesRef = collection(db, "users", profilId, "vues");
        const snapshot = await getDocs(vuesRef);

        const nombre = snapshot.size;

        compteurVues.dataset.vues = nombre;
        compteurVues.textContent =
            `👁️ ${nombre} ${nombre > 1 ? "vues" : "vue"}`;

    } catch (erreur) {
        console.error("Erreur lors du chargement des vues :", erreur);
    }
}

// ========================================
// FAVORIS
// ========================================

async function verifierFavori(profilId, bouton) {
    if (!utilisateurActuel || !bouton) return;

    try {
        const favoriRef = doc(
            db,
            "users",
            utilisateurActuel.uid,
            "favoris",
            profilId
        );

        const favoriSnap = await getDoc(favoriRef);

        bouton.classList.toggle("favoriActif", favoriSnap.exists());
        bouton.textContent = favoriSnap.exists() ? "⭐" : "☆";
        bouton.title = favoriSnap.exists()
            ? "Retirer des favoris"
            : "Ajouter aux favoris";

    } catch (erreur) {
        console.error("Erreur lors de la vérification du favori :", erreur);
    }
}

async function gererFavori(profilId, bouton) {
    if (!utilisateurActuel) {
        alert("Tu dois être connecté pour ajouter un favori ⭐");
        return;
    }

    if (!profilId) return;

    if (profilId === utilisateurActuel.uid) {
        alert("Tu ne peux pas ajouter ton propre profil aux favoris.");
        return;
    }

    if (bouton.dataset.chargement === "true") return;

    bouton.dataset.chargement = "true";

    try {
        const favoriRef = doc(
            db,
            "users",
            utilisateurActuel.uid,
            "favoris",
            profilId
        );

        const favoriSnap = await getDoc(favoriRef);

        if (favoriSnap.exists()) {
            await deleteDoc(favoriRef);

            bouton.classList.remove("favoriActif");
            bouton.textContent = "☆";
            bouton.title = "Ajouter aux favoris";

        } else {
            await setDoc(favoriRef, {
                profilId: profilId,
                date: new Date()
            });

            bouton.classList.add("favoriActif");
            bouton.textContent = "⭐";
            bouton.title = "Retirer des favoris";

            bouton.classList.add("favoriClick");

            setTimeout(() => {
                bouton.classList.remove("favoriClick");
            }, 300);
        }

    } catch (erreur) {
        console.error("Erreur lors du favori :", erreur);
        alert("Impossible de modifier les favoris.");
    }

    bouton.dataset.chargement = "false";
}

// ========================================
// RESEAUX SOCIAUX
// ========================================

function emojiReseau(type) {
    const emojis = {
        "YouTube": "▶️",
        "Twitch": "🎮",
        "Discord": "💬",
        "TikTok": "🎵",
        "Instagram": "📸",
        "Snapchat": "👻",
        "Facebook": "🔵",
        "Kick": "🟢",
        "Paypal": "💰",
        "Site Web": "🌐"
    };

    return emojis[type] || "🌐";
}

// ========================================
// CREATION DES CARTES
// ========================================

function creerCarte(profil) {
    const carte = creerElement("div", "carteProfil");

    carte.dataset.categories = JSON.stringify(profil.categories);
    carte.dataset.pseudo = normaliserNom(profil.pseudo);

    // PHOTO

    const photo = creerElement("img", "cartePhoto");
    photo.src = profil.photo || "Photo de profil/Accueil.jpg";
    photo.alt = `Photo de ${profil.pseudo}`;

    photo.onerror = () => {
        photo.onerror = null;
        photo.src = "Photo de profil/Accueil.jpg";
    };

    // CONTENU

    const contenu = creerElement("div", "carteContenu");

    const pseudo = creerElement(
        "div",
        "cartePseudo",
        profil.pseudo
    );

    const description = creerElement(
        "div",
        "carteDescription",
        profil.description || "Aucune description"
    );

    contenu.append(pseudo, description);

    // CATEGORIES

    const categories = creerElement("div", "carteCategories");

    const premieresCategories = profil.categories.slice(0, 3);
    const autresCategories = profil.categories.slice(3);

    premieresCategories.forEach(categorie => {
        categories.appendChild(
            creerElement("span", "categorieCarte", `🏷️ ${categorie}`)
        );
    });

    if (autresCategories.length > 0) {
        const boutonPlus = creerElement(
            "span",
            "categorieCarte categoriePlus",
            `+${autresCategories.length}`
        );

        const cachees = creerElement("div", "categoriesCachees");

        autresCategories.forEach(categorie => {
            cachees.appendChild(
                creerElement("span", "categorieCarte", `🏷️ ${categorie}`)
            );
        });

        boutonPlus.addEventListener("click", evenement => {
            evenement.stopPropagation();

            const ouvert = cachees.style.display === "flex";

            cachees.style.display = ouvert ? "none" : "flex";
            boutonPlus.textContent = ouvert
                ? `+${autresCategories.length}`
                : "−";
        });

        categories.append(boutonPlus, cachees);
    }

    contenu.appendChild(categories);

    // RESEAUX SOCIAUX

    if (profil.reseaux.length > 0) {
        const reseaux = creerElement("div", "carteReseaux");

        profil.reseaux.forEach(reseau => {
            if (!reseau || !reseau.lien) return;

            const lien = creerElement(
                "a",
                "reseauCarte",
                `${emojiReseau(reseau.type)} ${reseau.type || "Réseau"}`
            );

            lien.href = reseau.lien;
            lien.target = "_blank";
            lien.rel = "noopener noreferrer";

            lien.addEventListener("click", evenement => {
                evenement.stopPropagation();
            });

            reseaux.appendChild(lien);
        });

        contenu.appendChild(reseaux);
    }

    // COMPTEURS

    const compteurs = creerElement("div", "carteLikes");

    const compteurLikes = creerElement(
        "span",
        "carteLikesCompteur",
        "❤️ 0 like"
    );

    compteurLikes.dataset.likes = "0";

    const compteurVues = creerElement(
        "span",
        "carteVuesCompteur",
        "👁️ 0 vue"
    );

    compteurVues.dataset.vues = "0";

    compteurs.append(compteurLikes, compteurVues);
    contenu.appendChild(compteurs);

    // BOUTONS

    const actions = creerElement("div", "actionsCarte");

    const boutonLike = creerElement(
        "button",
        "boutonLike",
        "♡ J'aime"
    );

    boutonLike.type = "button";
    boutonLike.dataset.chargement = "false";

    const boutonFavori = creerElement(
        "button",
        "boutonFavori",
        "☆"
    );

    boutonFavori.type = "button";
    boutonFavori.title = "Ajouter aux favoris";
    boutonFavori.dataset.chargement = "false";

    const boutonProfil = creerElement(
        "button",
        "boutonVoirProfil",
        "👤 Voir profil"
    );

    boutonProfil.type = "button";

    actions.append(boutonLike, boutonFavori, boutonProfil);
    contenu.appendChild(actions);

    carte.append(photo, contenu);

    // EVENEMENTS

    boutonLike.addEventListener("click", evenement => {
        evenement.stopPropagation();

        gererLike(
            profil.pseudo,
            boutonLike,
            compteurLikes,
            carte
        );
    });

    boutonFavori.addEventListener("click", evenement => {
        evenement.stopPropagation();

        gererFavori(profil.id, boutonFavori);
    });

    boutonProfil.addEventListener("click", evenement => {
        evenement.stopPropagation();

        window.location.href =
            "profil.html?pseudo=" + encodeURIComponent(profil.pseudo);
    });

    carte.addEventListener("click", evenement => {
        if (
            evenement.target.closest(
                ".categoriePlus, .reseauCarte, .boutonVoirProfil, .boutonLike, .boutonFavori"
            )
        ) {
            return;
        }

        window.location.href =
            "profil.html?pseudo=" + encodeURIComponent(profil.pseudo);
    });

    // CHARGEMENT DES DONNEES

    chargerLikes(profil.pseudo, boutonLike, compteurLikes);
    chargerVues(profil.id, compteurVues);

    if (utilisateurActuel) {
        verifierFavori(profil.id, boutonFavori);
    }

    return carte;
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

            // EXACTEMENT UNE CATEGORIE : CLASH ROYALE

            if (
                categories.length !== 1 ||
                normaliserNom(categories[0]) !== "clash royale"
            ) {
                return;
            }

            profils.push({
                id: documentProfil.id,
                pseudo: data.pseudo || "Sans pseudo",
                photo: data.photo || "Photo de profil/Accueil.jpg",
                description: data.descriptionCourte || "",
                categories: categories,
                reseaux: Array.isArray(data.reseaux)
                    ? data.reseaux
                    : []
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
        `${profilsFiltres.length} ${
            profilsFiltres.length > 1 ? "profils" : "profil"
        } trouvé${profilsFiltres.length > 1 ? "s" : ""}`;

    listeProfils.replaceChildren();

    aucunProfil.hidden = profilsFiltres.length !== 0;

    profilsFiltres.forEach(profil => {
        listeProfils.appendChild(creerCarte(profil));
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
// DECONNEXION
// ========================================

logout.addEventListener("click", async () => {
    try {
        await signOut(auth);
    } catch (erreur) {
        console.error("Erreur de déconnexion :", erreur);
    }
});

// ========================================
// ETAT DE CONNEXION
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

    await chargerProfils();
});