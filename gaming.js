
"use strict";

// ========================================
// GAMING - HUSKYMICHEL
// ========================================

import { db } from "./firebase.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

// Éléments HTML
const listeJeux = document.getElementById("listeJeux");
const sectionProfilsJeu = document.getElementById("sectionProfilsJeu");
const titreJeu = document.getElementById("titreJeu");
const nombreProfilsJeu = document.getElementById("nombreProfilsJeu");
const listeProfilsJeu = document.getElementById("listeProfilsJeu");
const rechercheProfilJeu = document.getElementById("rechercheProfilJeu");
const retourJeux = document.getElementById("retourJeux");
const aucunProfilJeu = document.getElementById("aucunProfilJeu");

// Données
let profils = [];
let jeux = [];
let jeuSelectionne = null;

// Images de remplacement selon le jeu
const ICONES_JEUX = {
    "clash royale": "👑",
    "minecraft": "🟩",
    "fortnite": "🎯",
    "brawl stars": "⭐",
    "roblox": "🎮",
    "gta 5": "🚗",
    "gta v": "🚗",
    "rocket league": "⚽",
    "valorant": "🎯",
    "call of duty": "🎖️",
    "league of legends": "⚔️",
    "among us": "🚀"
};

// Sécurité pour afficher les données textuelles
function echapperHTML(texte) {
    return String(texte ?? "").replace(/[&<>"']/g, caractere => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[caractere]);
}

function obtenirPhoto(profil) {
    return profil.photo ||
        profil.photoURL ||
        profil.avatar ||
        "Photo de profil/Accueil.jpg";
}

function obtenirPseudo(profil, id) {
    return profil.pseudo || id;
}

// ========================================
// CHARGEMENT DES PROFILS
// ========================================

async function chargerProfils() {
    listeJeux.innerHTML = `
        <div class="gaming-chargement">
            Chargement des jeux...
        </div>
    `;

    try {
        const snapshot = await getDocs(collection(db, "users"));

        const profilsRecuperes = await Promise.all(
            snapshot.docs.map(async documentProfil => {
                const data = documentProfil.data();

                const categories = Array.isArray(data.categories)
                    ? data.categories
                        .filter(categorie => typeof categorie === "string")
                        .map(categorie => categorie.trim())
                        .filter(Boolean)
                    : [];

                const pseudo = obtenirPseudo(data, documentProfil.id);

                // Un profil doit avoir exactement une catégorie.
                if (categories.length !== 1) {
                    return null;
                }

                const categorie = categories[0];

                // Récupération des likes et des vues
                const [likesSnapshot, vuesSnapshot] = await Promise.all([
                    getDocs(collection(db, "users", pseudo, "likes"))
                        .catch(() => null),

                    getDocs(collection(db, "users", documentProfil.id, "vues"))
                        .catch(() => null)
                ]);

                return {
                    id: documentProfil.id,
                    pseudo,
                    photo: obtenirPhoto(data),
                    description: data.description || "",
                    categories,
                    jeu: categorie,
                    likes: likesSnapshot ? likesSnapshot.size : 0,
                    vues: vuesSnapshot ? vuesSnapshot.size : 0
                };
            })
        );

        profils = profilsRecuperes.filter(Boolean);

        creerListeJeux();

    } catch (erreur) {
        console.error("Erreur de chargement Gaming :", erreur);

        listeJeux.innerHTML = `
            <p class="gaming-message-vide">
                Impossible de charger les jeux pour le moment.
            </p>
        `;
    }
}

// ========================================
// CRÉATION DES CARTES DE JEUX
// ========================================

function creerListeJeux() {
    const groupes = new Map();

    profils.forEach(profil => {
        const nomJeu = profil.jeu;

        if (!groupes.has(nomJeu)) {
            groupes.set(nomJeu, []);
        }

        groupes.get(nomJeu).push(profil);
    });

    jeux = Array.from(groupes.entries())
        .map(([nom, joueurs]) => ({
            nom,
            joueurs,
            nombre: joueurs.length
        }))
        .sort((a, b) => b.nombre - a.nombre);

    if (jeux.length === 0) {
        listeJeux.innerHTML = `
            <p class="gaming-message-vide">
                Aucun jeu n'est encore disponible.
            </p>
        `;
        return;
    }

    listeJeux.innerHTML = jeux.map(jeu => {
        const cle = jeu.nom.toLowerCase();
        const icone = ICONES_JEUX[cle] || "🎮";

        return `
            <article
                class="carte-jeu"
                data-jeu="${echapperHTML(jeu.nom)}"
                tabindex="0"
                role="button"
                aria-label="Voir les profils de ${echapperHTML(jeu.nom)}"
            >
                <div class="image-jeu">${icone}</div>

                <div class="infos-jeu">
                    <h3>${echapperHTML(jeu.nom)}</h3>
                    <p>
                        ${jeu.nombre}
                        ${jeu.nombre > 1 ? "profils" : "profil"}
                    </p>
                </div>
            </article>
        `;
    }).join("");

    listeJeux.querySelectorAll(".carte-jeu").forEach(carte => {
        const ouvrir = () => ouvrirJeu(carte.dataset.jeu);

        carte.addEventListener("click", ouvrir);

        carte.addEventListener("keydown", evenement => {
            if (evenement.key === "Enter" || evenement.key === " ") {
                evenement.preventDefault();
                ouvrir();
            }
        });
    });
}

// ========================================
// OUVRIR UN JEU
// ========================================

function ouvrirJeu(nomJeu) {
    jeuSelectionne = nomJeu;

    const joueurs = profils.filter(profil =>
        profil.jeu === nomJeu
    );

    titreJeu.textContent = nomJeu;

    nombreProfilsJeu.textContent =
        `${joueurs.length} ${joueurs.length > 1 ? "profils" : "profil"}`;

    rechercheProfilJeu.value = "";

    afficherProfils(joueurs);

    listeJeux.hidden = true;
    sectionProfilsJeu.hidden = false;

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

// ========================================
// AFFICHAGE DES PROFILS
// ========================================

function afficherProfils(liste) {
    listeProfilsJeu.innerHTML = "";

    aucunProfilJeu.hidden = liste.length !== 0;

    liste.forEach(profil => {
        const carte = document.createElement("article");

        carte.className = "carteProfil";

        carte.dataset.pseudo = profil.pseudo;
        carte.dataset.categories = JSON.stringify(profil.categories);

        carte.innerHTML = `
            <div class="carteContenu">

                <img
                    class="cartePhoto"
                    src="${echapperHTML(profil.photo)}"
                    alt="Photo de ${echapperHTML(profil.pseudo)}"
                    onerror="this.onerror=null;this.src='Photo de profil/Accueil.jpg';"
                >

                <div class="cartePseudo">
                    ${echapperHTML(profil.pseudo)}
                </div>

                ${
                    profil.description
                        ? `<div class="carteDescription">
                            ${echapperHTML(profil.description)}
                           </div>`
                        : ""
                }

                <div class="carteCategories">
                    ${profil.categories.map(categorie => `
                        <span class="categorieCarte">
                            ${echapperHTML(categorie)}
                        </span>
                    `).join("")}
                </div>

                <div class="carteLikes">
                    <span class="carteLikesCompteur">
                        ❤️ ${profil.likes}
                    </span>

                    <span class="carteVuesCompteur">
                        👁️ ${profil.vues}
                    </span>
                </div>

                <a
                    class="boutonVoirProfilGaming"
                    href="profil.html?pseudo=${encodeURIComponent(profil.pseudo)}"
                >
                    Voir le profil
                </a>

            </div>
        `;

        listeProfilsJeu.appendChild(carte);
    });
}

// ========================================
// RECHERCHE DANS LE JEU
// ========================================

rechercheProfilJeu.addEventListener("input", () => {
    if (!jeuSelectionne) return;

    const recherche = rechercheProfilJeu.value
        .trim()
        .toLocaleLowerCase("fr");

    const joueurs = profils.filter(profil =>
        profil.jeu === jeuSelectionne &&
        profil.pseudo.toLocaleLowerCase("fr").includes(recherche)
    );

    afficherProfils(joueurs);
});

// ========================================
// RETOUR À LA LISTE DES JEUX
// ========================================

retourJeux.addEventListener("click", () => {
    sectionProfilsJeu.hidden = true;
    listeJeux.hidden = false;

    jeuSelectionne = null;
    rechercheProfilJeu.value = "";

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
});

// ========================================
// DÉMARRAGE
// ========================================

chargerProfils();
