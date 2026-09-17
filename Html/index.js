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


/* =========================================================
   ELEMENTS HTML
========================================================= */

const loginBtn =
    document.getElementById("loginBtn");

const profile =
    document.getElementById("profile");

const avatar =
    document.getElementById("avatar");

const menu =
    document.getElementById("menu");

const logout =
    document.getElementById("logout");

const listeProfils =
    document.getElementById("listeProfils");

const recherche =
    document.getElementById("rechercheProfil");

const resultatsRecherche =
    document.getElementById("resultatsRecherche");


/* =========================================================
   UTILISATEUR ACTUEL
========================================================= */

let utilisateurActuel = null;


/* =========================================================
   GOOGLE
========================================================= */

const provider =
    new GoogleAuthProvider();

provider.setCustomParameters({
    prompt: "select_account"
});


/* =========================================================
   MENU DU COMPTE
========================================================= */

if(avatar && menu){

    avatar.addEventListener(
        "click",
        (event)=>{

            event.stopPropagation();

            menu.style.display =
                menu.style.display === "block"
                ? "none"
                : "block";

        }
    );

}


document.addEventListener(
    "click",
    (event)=>{

        if(
            profile &&
            !profile.contains(event.target)
        ){

            if(menu){

                menu.style.display =
                    "none";

            }

        }

    }
);


/* =========================================================
   CONNEXION
========================================================= */

if(loginBtn){

    loginBtn.addEventListener(
        "click",
        async()=>{

            try{

                await signInWithPopup(
                    auth,
                    provider
                );

            }

            catch(error){

                console.error(
                    "Erreur lors de la connexion :",
                    error
                );

            }

        }
    );

}


/* =========================================================
   DECONNEXION
========================================================= */

if(logout){

    logout.addEventListener(
        "click",
        async()=>{

            try{

                await signOut(auth);

            }

            catch(error){

                console.error(
                    "Erreur lors de la déconnexion :",
                    error
                );

            }

        }
    );

}


/* =========================================================
   ETAT DE LA CONNEXION
========================================================= */

onAuthStateChanged(
    auth,
    async(user)=>{

        utilisateurActuel =
            user;


        /* =================================================
           UTILISATEUR CONNECTE
        ================================================= */

        if(user){

            /* =========================
               PHOTO GOOGLE
            ========================= */

            if(
                avatar &&
                user.photoURL
            ){

                avatar.src =
                    user.photoURL.replace(
                        "=s96-c",
                        "=s512-c"
                    );

            }


            /* =========================
               AFFICHER LE COMPTE
            ========================= */

            if(loginBtn){

                loginBtn.style.display =
                    "none";

            }


            if(profile){

                profile.style.display =
                    "block";

            }


            /* =========================
               VERIFIER LE PROFIL
            ========================= */

            try{

                const profilRef =
                    doc(
                        db,
                        "users",
                        user.uid
                    );


                const profilSnap =
                    await getDoc(
                        profilRef
                    );


                if(
                    !profilSnap.exists()
                ){

                    window.location.href =
                        "creation-profil.html";

                    return;

                }

            }

            catch(error){

                console.error(
                    "Erreur lors de la vérification du profil :",
                    error
                );

            }


            /* =========================
               CHARGER LES PROFILS
            ========================= */

            chargerProfils();

        }


        /* =================================================
           UTILISATEUR NON CONNECTE
        ================================================= */

        else{

            if(loginBtn){

                loginBtn.style.display =
                    "block";

            }


            if(profile){

                profile.style.display =
                    "none";

            }


            chargerProfils();

        }

    }
);


/* =========================================================
   ANIMATION DE COEURS
========================================================= */

function lancerAnimationCoeurs(carte){

    if(!carte){

        return;

    }


    carte.classList.add(
        "animationLike"
    );


    const nombreCoeurs =
        18;


    for(
        let i = 0;
        i < nombreCoeurs;
        i++
    ){

        const coeur =
            document.createElement("div");


        coeur.className =
            "coeurAnimation";


        coeur.textContent =
            "❤️";


        coeur.style.left =
            (
                10 +
                Math.random() * 80
            ) +
            "%";


        coeur.style.bottom =
            (
                10 +
                Math.random() * 20
            ) +
            "px";


        coeur.style.fontSize =
            (
                25 +
                Math.random() * 25
            ) +
            "px";


        coeur.style.animationDelay =
            (
                Math.random() * 0.35
            ) +
            "s";


        coeur.style.setProperty(
            "--deplacement",
            (
                -80 +
                Math.random() * 160
            ) +
            "px"
        );


        carte.appendChild(
            coeur
        );


        setTimeout(
            ()=>{

                coeur.remove();

            },
            1500
        );

    }


    setTimeout(
        ()=>{

            carte.classList.remove(
                "animationLike"
            );

        },
        1100
    );

}


/* =========================================================
   ANIMATION DU BOUTON LIKE
========================================================= */

function animerBoutonLike(bouton){

    if(!bouton){

        return;

    }


    bouton.classList.add(
        "likeClick"
    );


    setTimeout(
        ()=>{

            bouton.classList.remove(
                "likeClick"
            );

        },
        250
    );

}


/* =========================================================
   LIKER UN PROFIL
========================================================= */

async function gererLike(
    pseudo,
    bouton,
    compteur,
    carte
){

    if(!utilisateurActuel){

        alert(
            "Tu dois être connecté pour aimer un profil ❤️"
        );

        return;

    }


    if(
        bouton.dataset.chargement ===
        "true"
    ){

        return;

    }


    bouton.dataset.chargement =
        "true";


    try{

        const likeRef =
            doc(
                db,
                "users",
                pseudo,
                "likes",
                utilisateurActuel.uid
            );


        const likeSnap =
            await getDoc(
                likeRef
            );


        /* =================================================
           RETIRER LIKE
        ================================================= */

        if(
            likeSnap.exists()
        ){

            await deleteDoc(
                likeRef
            );


            bouton.classList.remove(
                "liked"
            );


            bouton.textContent =
                "♡ J'aime";


            let nombre =
                parseInt(
                    compteur.dataset.likes ||
                    "0"
                );


            nombre =
                Math.max(
                    0,
                    nombre - 1
                );


            compteur.dataset.likes =
                nombre;


            compteur.textContent =
                "❤️ " +
                nombre +
                (
                    nombre > 1
                    ? " likes"
                    : " like"
                );

        }


        /* =================================================
           AJOUTER LIKE
        ================================================= */

        else{

            await setDoc(
                likeRef,
                {

                    uid:
                        utilisateurActuel.uid,

                    date:
                        new Date()

                }
            );


            bouton.classList.add(
                "liked"
            );


            bouton.textContent =
                "♥ J'aime";


            let nombre =
                parseInt(
                    compteur.dataset.likes ||
                    "0"
                );


            nombre++;


            compteur.dataset.likes =
                nombre;


            compteur.textContent =
                "❤️ " +
                nombre +
                (
                    nombre > 1
                    ? " likes"
                    : " like"
                );


            animerBoutonLike(
                bouton
            );


            lancerAnimationCoeurs(
                carte
            );

        }

    }

    catch(error){

        console.error(
            "Erreur lors du like :",
            error
        );


        alert(
            "Impossible de modifier le like."
        );

    }


    bouton.dataset.chargement =
        "false";

}


/* =========================================================
   COMPTER LES LIKES
========================================================= */

async function chargerLikes(
    pseudo,
    bouton,
    compteur
){

    try{

        const likesRef =
            collection(
                db,
                "users",
                pseudo,
                "likes"
            );


        const snapshot =
            await getDocs(
                likesRef
            );


        const nombre =
            snapshot.size;


        compteur.dataset.likes =
            nombre;


        compteur.textContent =
            "❤️ " +
            nombre +
            (
                nombre > 1
                ? " likes"
                : " like"
            );


        if(utilisateurActuel){

            const monLikeRef =
                doc(
                    db,
                    "users",
                    pseudo,
                    "likes",
                    utilisateurActuel.uid
                );


            const monLikeSnap =
                await getDoc(
                    monLikeRef
                );


            if(
                monLikeSnap.exists()
            ){

                bouton.classList.add(
                    "liked"
                );


                bouton.textContent =
                    "♥ J'aime";

            }

            else{

                bouton.classList.remove(
                    "liked"
                );


                bouton.textContent =
                    "♡ J'aime";

            }

        }

    }

    catch(error){

        console.error(
            "Erreur lors du chargement des likes :",
            error
        );

    }

}


/* =========================================================
   FAVORIS
========================================================= */

async function verifierFavori(
    profilId,
    bouton
){

    if(
        !utilisateurActuel ||
        !bouton
    ){

        return;

    }


    try{

        const favoriRef =
            doc(
                db,
                "users",
                utilisateurActuel.uid,
                "favoris",
                profilId
            );


        const favoriSnap =
            await getDoc(
                favoriRef
            );


        if(
            favoriSnap.exists()
        ){

            bouton.classList.add(
                "favoriActif"
            );


            bouton.textContent =
                "⭐";

            bouton.title =
                "Retirer des favoris";

        }

        else{

            bouton.classList.remove(
                "favoriActif"
            );


            bouton.textContent =
                "☆";

            bouton.title =
                "Ajouter aux favoris";

        }

    }

    catch(error){

        console.error(
            "Erreur lors de la vérification du favori :",
            error
        );

    }

}


/* =========================================================
   AJOUTER / RETIRER UN FAVORI
========================================================= */

async function gererFavori(
    profilId,
    bouton
){

    if(!utilisateurActuel){

        alert(
            "Tu dois être connecté pour ajouter un favori ⭐"
        );

        return;

    }


    if(!profilId){

        return;

    }


    if(
        profilId === utilisateurActuel.uid
    ){

        alert(
            "Tu ne peux pas ajouter ton propre profil aux favoris."
        );

        return;

    }


    if(
        bouton.dataset.chargement ===
        "true"
    ){

        return;

    }


    bouton.dataset.chargement =
        "true";


    try{

        const favoriRef =
            doc(
                db,
                "users",
                utilisateurActuel.uid,
                "favoris",
                profilId
            );


        const favoriSnap =
            await getDoc(
                favoriRef
            );


        /* =================================================
           RETIRER DES FAVORIS
        ================================================= */

        if(
            favoriSnap.exists()
        ){

            await deleteDoc(
                favoriRef
            );


            bouton.classList.remove(
                "favoriActif"
            );


            bouton.textContent =
                "☆";

            bouton.title =
                "Ajouter aux favoris";

        }


        /* =================================================
           AJOUTER AUX FAVORIS
        ================================================= */

        else{

            await setDoc(
                favoriRef,
                {

                    profilId:
                        profilId,

                    date:
                        new Date()

                }
            );


            bouton.classList.add(
                "favoriActif"
            );


            bouton.textContent =
                "⭐";

            bouton.title =
                "Retirer des favoris";


            /* Petite animation */

            bouton.classList.add(
                "favoriClick"
            );


            setTimeout(
                ()=>{

                    bouton.classList.remove(
                        "favoriClick"
                    );

                },
                300
            );

        }

    }

    catch(error){

        console.error(
            "Erreur lors du favori :",
            error
        );


        alert(
            "Impossible de modifier les favoris."
        );

    }


    bouton.dataset.chargement =
        "false";

}


/* =========================================================
   CHARGER LES PROFILS
========================================================= */

async function chargerProfils(){

    if(!listeProfils){

        return;

    }


    listeProfils.innerHTML =
        "";


    try{

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "users"
                )
            );


        snapshot.forEach(
            (profilDoc)=>{

                const data =
                    profilDoc.data();


                /*
                   IMPORTANT :

                   profilDoc.id = UID du propriétaire
                */

                const profilId =
                    profilDoc.id;


                const pseudo =
                    data.pseudo ||
                    "Sans pseudo";


                /* =================================================
                   CARTE
                ================================================= */

                const carte =
                    document.createElement(
                        "div"
                    );


                carte.className =
                    "carteProfil";


                /* =================================================
                   CATEGORIES
                ================================================= */

                const categories =
                    Array.isArray(
                        data.categories
                    )
                    ? data.categories
                    : [];


                const troisCategories =
                    categories.slice(
                        0,
                        3
                    );


                const autresCategories =
                    categories.slice(
                        3
                    );


                let categoriesHTML =
                    "";


                troisCategories.forEach(
                    (categorie)=>{

                        categoriesHTML += `

                            <span class="categorieCarte">

                                🏷️ ${categorie}

                            </span>

                        `;

                    }
                );


                if(
                    autresCategories.length > 0
                ){

                    categoriesHTML += `

                        <span
                            class="
                                categorieCarte
                                categoriePlus
                            "
                        >

                            +${autresCategories.length}

                        </span>


                        <div class="categoriesCachees">

                            ${
                                autresCategories
                                .map(
                                    (categorie)=>`

                                        <span class="categorieCarte">

                                            🏷️ ${categorie}

                                        </span>

                                    `
                                )
                                .join("")
                            }

                        </div>

                    `;

                }


                /* =================================================
                   RESEAUX
                ================================================= */

                const reseaux =
                    Array.isArray(
                        data.reseaux
                    )
                    ? data.reseaux
                    : [];


                let reseauxHTML =
                    "";


                reseaux.forEach(
                    (reseau)=>{

                        if(
                            !reseau ||
                            !reseau.lien
                        ){

                            return;

                        }


                        let emoji =
                            "🌐";


                        if(
                            reseau.type ===
                            "YouTube"
                        ){

                            emoji =
                                "▶️";

                        }

                        else if(
                            reseau.type ===
                            "Twitch"
                        ){

                            emoji =
                                "🎮";

                        }

                        else if(
                            reseau.type ===
                            "Discord"
                        ){

                            emoji =
                                "💬";

                        }

                        else if(
                            reseau.type ===
                            "TikTok"
                        ){

                            emoji =
                                "🎵";

                        }

                        else if(
                            reseau.type ===
                            "Instagram"
                        ){

                            emoji =
                                "📸";

                        }

                        else if(
                            reseau.type ===
                            "Snapchat"
                        ){

                            emoji =
                                "👻";

                        }

                        else if(
                            reseau.type ===
                            "Facebook"
                        ){

                            emoji =
                                "🔵";

                        }

                        else if(
                            reseau.type ===
                            "Kick"
                        ){

                            emoji =
                                "🟢";

                        }

                        else if(
                            reseau.type ===
                            "Paypal"
                        ){

                            emoji =
                                "💰";

                        }

                        else if(
                            reseau.type ===
                            "Site Web"
                        ){

                            emoji =
                                "🌐";

                        }


                        reseauxHTML += `

                            <a
                                class="reseauCarte"
                                href="${reseau.lien}"
                                target="_blank"
                                rel="noopener noreferrer"
                            >

                                ${emoji}
                                ${reseau.type}

                            </a>

                        `;

                    }
                );


                /* =================================================
                   CONTENU CARTE
                ================================================= */

                carte.innerHTML = `

                    <img
                        class="cartePhoto"
                        src="${data.photo || ""}"
                        alt="Photo de ${pseudo}"
                    >


                    <div class="carteContenu">

                        <div class="cartePseudo">

                            ${pseudo}

                        </div>


                        <div class="carteDescription">

                            ${
                                data.descriptionCourte ||
                                "Aucune description"
                            }

                        </div>


                        <div class="carteCategories">

                            ${categoriesHTML}

                        </div>


                        ${
                            reseauxHTML
                            ? `

                                <div class="carteReseaux">

                                    ${reseauxHTML}

                                </div>

                            `
                            : ""
                        }


                        <div class="carteLikes">

                            <span
                                class="carteLikesCompteur"
                                data-likes="0"
                            >

                                ❤️ 0 likes

                            </span>

                        </div>


                        <div class="actionsCarte">

                            <button
                                class="boutonLike"
                                type="button"
                            >

                                ♡ J'aime

                            </button>


                            <button
                                class="boutonFavori"
                                type="button"
                                title="Ajouter aux favoris"
                            >

                                ☆

                            </button>


                            <button
                                class="boutonVoirProfil"
                                type="button"
                            >

                                👤 Voir profil

                            </button>

                        </div>

                    </div>

                `;


                /* =================================================
                   ELEMENTS
                ================================================= */

                const boutonLike =
                    carte.querySelector(
                        ".boutonLike"
                    );


                const compteur =
                    carte.querySelector(
                        ".carteLikesCompteur"
                    );


                const boutonFavori =
                    carte.querySelector(
                        ".boutonFavori"
                    );


                /* =================================================
                   LIKES
                ================================================= */

                chargerLikes(
                    pseudo,
                    boutonLike,
                    compteur
                );


                /* =================================================
                   FAVORI
                ================================================= */

                if(
                    utilisateurActuel &&
                    boutonFavori
                ){

                    verifierFavori(
                        profilId,
                        boutonFavori
                    );

                }


                /* =================================================
                   BOUTON LIKE
                ================================================= */

                if(boutonLike){

                    boutonLike.addEventListener(
                        "click",
                        (event)=>{

                            event.stopPropagation();


                            gererLike(
                                pseudo,
                                boutonLike,
                                compteur,
                                carte
                            );

                        }
                    );

                }


                /* =================================================
                   BOUTON FAVORI
                ================================================= */

                if(boutonFavori){

                    boutonFavori.addEventListener(
                        "click",
                        (event)=>{

                            event.stopPropagation();


                            gererFavori(
                                profilId,
                                boutonFavori
                            );

                        }
                    );

                }


                /* =================================================
                   CATEGORIES +X
                ================================================= */

                const boutonPlus =
                    carte.querySelector(
                        ".categoriePlus"
                    );


                if(boutonPlus){

                    boutonPlus.addEventListener(
                        "click",
                        (event)=>{

                            event.stopPropagation();


                            const categoriesCachees =
                                carte.querySelector(
                                    ".categoriesCachees"
                                );


                            if(
                                !categoriesCachees
                            ){

                                return;

                            }


                            if(
                                categoriesCachees.style.display
                                === "flex"
                            ){

                                categoriesCachees.style.display =
                                    "none";


                                boutonPlus.textContent =
                                    "+" +
                                    categoriesCachees
                                    .querySelectorAll(
                                        ".categorieCarte"
                                    )
                                    .length;

                            }

                            else{

                                categoriesCachees.style.display =
                                    "flex";


                                boutonPlus.textContent =
                                    "−";

                            }

                        }
                    );

                }


                /* =================================================
                   RESEAUX
                ================================================= */

                const liensReseaux =
                    carte.querySelectorAll(
                        ".reseauCarte"
                    );


                liensReseaux.forEach(
                    (lien)=>{

                        lien.addEventListener(
                            "click",
                            (event)=>{

                                event.stopPropagation();

                            }
                        );

                    }
                );


                /* =================================================
                   VOIR PROFIL
                ================================================= */

                const boutonVoirProfil =
                    carte.querySelector(
                        ".boutonVoirProfil"
                    );


                if(boutonVoirProfil){

                    boutonVoirProfil.addEventListener(
                        "click",
                        (event)=>{

                            event.stopPropagation();


                            window.location.href =
                                "profil.html?pseudo=" +
                                encodeURIComponent(
                                    pseudo
                                );

                        }
                    );

                }


                /* =================================================
                   AJOUTER CARTE
                ================================================= */

                listeProfils.appendChild(
                    carte
                );


                /* =================================================
                   CLIC CARTE
                ================================================= */

                carte.addEventListener(
                    "click",
                    (event)=>{

                        if(
                            event.target.closest(
                                ".categoriePlus"
                            )
                        ){

                            return;

                        }


                        if(
                            event.target.closest(
                                ".reseauCarte"
                            )
                        ){

                            return;

                        }


                        if(
                            event.target.closest(
                                ".boutonVoirProfil"
                            )
                        ){

                            return;

                        }


                        if(
                            event.target.closest(
                                ".boutonLike"
                            )
                        ){

                            return;

                        }


                        if(
                            event.target.closest(
                                ".boutonFavori"
                            )
                        ){

                            return;

                        }


                        window.location.href =
                            "profil.html?pseudo=" +
                            encodeURIComponent(
                                pseudo
                            );

                    }
                );

            }
        );

    }

    catch(error){

        console.error(
            "Erreur lors du chargement des profils :",
            error
        );


        listeProfils.innerHTML = `

            <p>

                Impossible de charger les profils.

            </p>

        `;

    }

}


/* =========================================================
   RECHERCHE
========================================================= */

if(
    recherche &&
    resultatsRecherche
){

    recherche.addEventListener(
        "input",
        async()=>{

            const texte =
                recherche.value.trim();


            if(
                texte === ""
            ){

                resultatsRecherche.innerHTML =
                    "";


                resultatsRecherche.style.display =
                    "none";


                return;

            }


            try{

                const snapshot =
                    await getDocs(
                        collection(
                            db,
                            "users"
                        )
                    );


                resultatsRecherche.innerHTML =
                    "";


                const texteRecherche =
                    texte.toLowerCase();


                let nombreResultats =
                    0;


                snapshot.forEach(
                    (profilDoc)=>{

                        const data =
                            profilDoc.data();


                        const pseudo =
                            data.pseudo ||
                            "";


                        if(
                            pseudo
                                .toLowerCase()
                                .includes(
                                    texteRecherche
                                )
                        ){

                            nombreResultats++;


                            const resultat =
                                document.createElement(
                                    "div"
                                );


                            resultat.className =
                                "resultatRecherche";


                            const nom =
                                document.createElement(
                                    "div"
                                );


                            nom.className =
                                "resultatRecherchePseudo";


                            nom.textContent =
                                pseudo;


                            const image =
                                document.createElement(
                                    "img"
                                );


                            image.src =
                                data.photo ||
                                "";


                            image.alt =
                                pseudo;


                            resultat.appendChild(
                                nom
                            );


                            resultat.appendChild(
                                image
                            );


                            resultat.addEventListener(
                                "click",
                                ()=>{

                                    window.location.href =
                                        "profil.html?pseudo=" +
                                        encodeURIComponent(
                                            pseudo
                                        );

                                }
                            );


                            resultatsRecherche.appendChild(
                                resultat
                            );

                        }

                    }
                );


                if(
                    nombreResultats > 0
                ){

                    resultatsRecherche.style.display =
                        "block";

                }

                else{

                    resultatsRecherche.innerHTML =
                        "";


                    resultatsRecherche.style.display =
                        "none";

                }

            }

            catch(error){

                console.error(
                    "Erreur lors de la recherche :",
                    error
                );


                resultatsRecherche.innerHTML =
                    "";


                resultatsRecherche.style.display =
                    "none";

            }

        }
    );

}