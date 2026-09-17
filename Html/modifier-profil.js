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
    setDoc
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";


/* =========================================================
   ELEMENTS
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

const monProfil =
    document.getElementById("monProfil");

const logoAccueil =
    document.getElementById("logoAccueil");

const retourAccueil =
    document.getElementById("retourAccueil");

const recherche =
    document.getElementById("rechercheProfil");

const resultatsRecherche =
    document.getElementById("resultatsRecherche");


/* =========================================================
   CHAMPS DU PROFIL
========================================================= */

const champPhoto =
    document.getElementById("photo");

const apercuPhoto =
    document.getElementById("apercuPhoto");

const champPseudo =
    document.getElementById("pseudo");

const champDescriptionCourte =
    document.getElementById("descriptionCourte");

const champDescriptionLongue =
    document.getElementById("descriptionLongue");

const champCategories =
    document.getElementById("categories");

const champVideoYoutube =
    document.getElementById("videoYoutube");

const reseauxModification =
    document.getElementById("reseauxModification");

const ajouterReseau =
    document.getElementById("ajouterReseau");

const sauvegarderProfil =
    document.getElementById("sauvegarderProfil");

const annulerModification =
    document.getElementById("annulerModification");

const messageModification =
    document.getElementById("messageModification");


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
                    "Erreur de connexion :",
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

                window.location.href =
                    "index.html";

            }

            catch(error){

                console.error(
                    "Erreur de déconnexion :",
                    error
                );

            }

        }
    );

}


/* =========================================================
   NAVIGATION
========================================================= */

if(logoAccueil){

    logoAccueil.addEventListener(
        "click",
        ()=>{

            window.location.href =
                "index.html";

        }
    );

}


if(retourAccueil){

    retourAccueil.addEventListener(
        "click",
        ()=>{

            window.location.href =
                "index.html";

        }
    );

}


if(monProfil){

    monProfil.addEventListener(
        "click",
        ()=>{

            if(!utilisateurActuel){

                return;

            }


            window.location.href =
                "profil.html?pseudo=" +
                encodeURIComponent(
                    champPseudo.value
                );

        }
    );

}


if(annulerModification){

    annulerModification.addEventListener(
        "click",
        ()=>{

            window.location.href =
                "index.html";

        }
    );

}


/* =========================================================
   ETAT DE CONNEXION
========================================================= */

onAuthStateChanged(
    auth,
    async(user)=>{

        utilisateurActuel =
            user;


        if(user){

            /* =========================
               CONNECTE
            ========================= */

            if(loginBtn){

                loginBtn.style.display =
                    "none";

            }


            if(profile){

                profile.style.display =
                    "block";

            }


            if(avatar){

                if(user.photoURL){

                    avatar.src =
                        user.photoURL.replace(
                            "=s96-c",
                            "=s512-c"
                        );

                }

            }


            /* =========================
               CHARGER LE PROFIL
            ========================= */

            await chargerProfil();

        }

        else{

            /* =========================
               PAS CONNECTE
            ========================= */

            if(loginBtn){

                loginBtn.style.display =
                    "block";

            }


            if(profile){

                profile.style.display =
                    "none";

            }


            /*
               Une personne non connectée
               n'a rien à faire ici.
            */

            setTimeout(
                ()=>{

                    window.location.href =
                        "index.html";

                },
                500
            );

        }

    }
);


/* =========================================================
   CHARGER LE PROFIL FIRESTORE
========================================================= */

async function chargerProfil(){

    if(!utilisateurActuel){

        return;

    }


    try{

        const profilRef =
            doc(
                db,
                "users",
                utilisateurActuel.uid
            );


        const profilSnap =
            await getDoc(
                profilRef
            );


        if(
            !profilSnap.exists()
        ){

            afficherMessage(
                "Ton profil n'existe pas encore.",
                "erreur"
            );

            return;

        }


        const data =
            profilSnap.data();


        /* =================================================
           PHOTO
        ================================================= */

        if(champPhoto){

            champPhoto.value =
                data.photo || "";

        }


        mettreAJourApercu();


        /* =================================================
           PSEUDO
        ================================================= */

        if(champPseudo){

            champPseudo.value =
                data.pseudo || "";

        }


        /* =================================================
           DESCRIPTION COURTE
        ================================================= */

        if(champDescriptionCourte){

            champDescriptionCourte.value =
                data.descriptionCourte || "";

        }


        /* =================================================
           DESCRIPTION LONGUE
        ================================================= */

        if(champDescriptionLongue){

            champDescriptionLongue.value =
                data.descriptionLongue || "";

        }


        /* =================================================
           CATEGORIES
        ================================================= */

        if(champCategories){

            const listeCategories =
                Array.isArray(data.categories)
                ? data.categories
                : [];


            champCategories.value =
                listeCategories.join(
                    ", "
                );

        }


        /* =================================================
           VIDEO
        ================================================= */

        if(champVideoYoutube){

            champVideoYoutube.value =
                data.videoYoutube || "";

        }


        /* =================================================
           RESEAUX
        ================================================= */

        chargerReseaux(
            Array.isArray(data.reseaux)
            ? data.reseaux
            : []
        );

    }

    catch(error){

        console.error(
            "Erreur lors du chargement du profil :",
            error
        );


        afficherMessage(
            "Impossible de charger ton profil.",
            "erreur"
        );

    }

}


/* =========================================================
   APERCU PHOTO
========================================================= */

function mettreAJourApercu(){

    if(
        !apercuPhoto ||
        !champPhoto
    ){

        return;

    }


    const lien =
        champPhoto.value.trim();


    if(lien){

        apercuPhoto.src =
            lien;

        apercuPhoto.style.display =
            "block";

    }

    else{

        apercuPhoto.src =
            "";

        apercuPhoto.style.display =
            "none";

    }

}


if(champPhoto){

    champPhoto.addEventListener(
        "input",
        mettreAJourApercu
    );

}


/* =========================================================
   CHARGER LES RESEAUX
========================================================= */

function chargerReseaux(liste){

    if(!reseauxModification){

        return;

    }


    reseauxModification.innerHTML =
        "";


    liste.forEach(
        (reseau)=>{

            ajouterLigneReseau(
                reseau.type || "",
                reseau.lien || ""
            );

        }
    );

}


/* =========================================================
   AJOUTER UNE LIGNE RESEAU
========================================================= */

function ajouterLigneReseau(
    type = "",
    lien = ""
){

    if(!reseauxModification){

        return;

    }


    const ligne =
        document.createElement(
            "div"
        );


    ligne.className =
        "ligneReseauModification";


    ligne.innerHTML = `

        <select class="typeReseau">

            <option value="YouTube">
                YouTube
            </option>

            <option value="Twitch">
                Twitch
            </option>

            <option value="Discord">
                Discord
            </option>

            <option value="TikTok">
                TikTok
            </option>

            <option value="Instagram">
                Instagram
            </option>

            <option value="Snapchat">
                Snapchat
            </option>

            <option value="Facebook">
                Facebook
            </option>

            <option value="Kick">
                Kick
            </option>

            <option value="Paypal">
                Paypal
            </option>

            <option value="Site Web">
                Site Web
            </option>

            <option value="Autre">
                Autre
            </option>

        </select>


        <input
            type="url"
            class="lienReseau"
            placeholder="Lien du réseau"
        >


        <button
            type="button"
            class="supprimerReseau"
        >

            🗑️

        </button>

    `;


    const select =
        ligne.querySelector(
            ".typeReseau"
        );


    const input =
        ligne.querySelector(
            ".lienReseau"
        );


    const supprimer =
        ligne.querySelector(
            ".supprimerReseau"
        );


    if(type){

        select.value =
            type;

    }


    input.value =
        lien;


    supprimer.addEventListener(
        "click",
        ()=>{

            ligne.remove();

        }
    );


    reseauxModification.appendChild(
        ligne
    );

}


/* =========================================================
   BOUTON AJOUTER RESEAU
========================================================= */

if(ajouterReseau){

    ajouterReseau.addEventListener(
        "click",
        ()=>{

            ajouterLigneReseau();

        }
    );

}


/* =========================================================
   RECUPERER LES RESEAUX
========================================================= */

function recupererReseaux(){

    if(!reseauxModification){

        return [];

    }


    const lignes =
        reseauxModification.querySelectorAll(
            ".ligneReseauModification"
        );


    const reseaux = [];


    lignes.forEach(
        (ligne)=>{

            const type =
                ligne.querySelector(
                    ".typeReseau"
                )?.value || "";


            const lien =
                ligne.querySelector(
                    ".lienReseau"
                )?.value.trim() || "";


            /*
               On ignore les lignes vides.
            */

            if(lien !== ""){

                reseaux.push({

                    type:
                        type,

                    lien:
                        lien

                });

            }

        }
    );


    return reseaux;

}


/* =========================================================
   AFFICHER UN MESSAGE
========================================================= */

function afficherMessage(
    texte,
    type
){

    if(!messageModification){

        return;

    }


    messageModification.textContent =
        texte;


    messageModification.className =
        "messageModification " +
        type;

}


/* =========================================================
   SAUVEGARDER LE PROFIL
========================================================= */

if(sauvegarderProfil){

    sauvegarderProfil.addEventListener(
        "click",
        async()=>{

            if(!utilisateurActuel){

                afficherMessage(
                    "Tu dois être connecté.",
                    "erreur"
                );

                return;

            }


            /* =================================================
               EMPECHER LES CLICS MULTIPLES
            ================================================= */

            if(
                sauvegarderProfil.dataset.chargement ===
                "true"
            ){

                return;

            }


            sauvegarderProfil.dataset.chargement =
                "true";


            sauvegarderProfil.disabled =
                true;


            sauvegarderProfil.textContent =
                "⏳ Sauvegarde...";


            try{

                /* =================================================
                   RECUPERER LES VALEURS
                ================================================= */

                const photo =
                    champPhoto.value.trim();


                const pseudo =
                    champPseudo.value.trim();


                const descriptionCourte =
                    champDescriptionCourte.value.trim();


                const descriptionLongue =
                    champDescriptionLongue.value.trim();


                const videoYoutube =
                    champVideoYoutube.value.trim();


                /* =================================================
                   VERIFICATION PSEUDO
                ================================================= */

                if(!pseudo){

                    afficherMessage(
                        "Le pseudo est obligatoire.",
                        "erreur"
                    );

                    return;

                }


                /* =================================================
                   CATEGORIES
                ================================================= */

                const categories =
                    champCategories.value
                        .split(",")

                        .map(
                            (categorie)=>
                                categorie.trim()
                        )

                        .filter(
                            (categorie)=>
                                categorie !== ""
                        );


                /* =================================================
                   RESEAUX
                ================================================= */

                const reseaux =
                    recupererReseaux();


                /* =================================================
                   DOCUMENT FIRESTORE
                ================================================= */

                const profilRef =
                    doc(
                        db,
                        "users",
                        utilisateurActuel.uid
                    );


                /* =================================================
                   SAUVEGARDE
                ================================================= */

                await setDoc(
                    profilRef,
                    {

                        photo:
                            photo,

                        pseudo:
                            pseudo,

                        descriptionCourte:
                            descriptionCourte,

                        descriptionLongue:
                            descriptionLongue,

                        categories:
                            categories,

                        reseaux:
                            reseaux,

                        videoYoutube:
                            videoYoutube

                    },
                    {
                        merge: true
                    }
                );


                /* =================================================
                   MESSAGE
                ================================================= */

                afficherMessage(
                    "✅ Ton profil a été sauvegardé !",
                    "succes"
                );


                /* =================================================
                   ACTUALISER AVATAR
                ================================================= */

                if(
                    avatar &&
                    photo
                ){

                    avatar.src =
                        photo;

                }


                /* =================================================
                   REDIRECTION
                ================================================= */

                setTimeout(
                    ()=>{

                        window.location.href =
                            "profil.html?pseudo=" +
                            encodeURIComponent(
                                pseudo
                            );

                    },
                    1000
                );

            }

            catch(error){

                console.error(
                    "Erreur lors de la sauvegarde :",
                    error
                );


                afficherMessage(
                    "❌ Impossible de sauvegarder le profil.",
                    "erreur"
                );

            }

            finally{

                sauvegarderProfil.dataset.chargement =
                    "false";


                sauvegarderProfil.disabled =
                    false;


                sauvegarderProfil.textContent =
                    "💾 Sauvegarder";

            }

        }
    );

}


/* =========================================================
   RECHERCHE DE PROFILS
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


            if(texte === ""){

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
                            data.pseudo || "";


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
                                data.photo || "";


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