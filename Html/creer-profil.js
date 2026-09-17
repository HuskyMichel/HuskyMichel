import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged,
    signOut,
    deleteUser
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

import {
    collection,
    query,
    where,
    getDocs,
    doc,
    getDoc,
    setDoc,
    deleteDoc
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";


/* =========================================================
   VARIABLES
========================================================= */

let utilisateurActuel = null;

let categoriesParGroupe = {

    Contenu: [],
    creation: [],
    jeux_video: [],
    musique: [],
    sport: [],
    technologie: []

};

let categoriesSelectionnees = [];

let profilExiste = false;


/* =========================================================
   ELEMENTS HTML
========================================================= */

const photo =
    document.getElementById("photo");

const pseudo =
    document.getElementById("pseudo");

const pseudoEtat =
    document.getElementById("pseudoEtat");

const descriptionCourte =
    document.getElementById("descriptionCourte");

const descriptionLongue =
    document.getElementById("descriptionLongue");

const reseaux =
    document.getElementById("reseaux");

const ajouterReseau =
    document.getElementById("ajouterReseau");

const videoYoutube =
    document.getElementById("videoYoutube");

const categoriesContainer =
    document.getElementById("categoriesContainer");

const categoriesSelectionneesContainer =
    document.getElementById("categoriesSelectionnees");

const saveProfile =
    document.getElementById("saveProfile");

const deconnexion =
    document.getElementById("deconnexion");


console.log(
    "creer-profil.js chargé"
);


/* =========================================================
   PHOTO UTILISATEUR
========================================================= */

function afficherPhotoUtilisateur(user){

    if(
        !photo ||
        !user
    ){

        return;

    }


    if(user.photoURL){

        photo.src =
            user.photoURL.replace(
                "=s96-c",
                "=s512-c"
            );

    }

    else{

        photo.removeAttribute(
            "src"
        );

    }

}


/* =========================================================
   CREER BOUTON SUPPRESSION
========================================================= */

function creerBoutonSuppression(){

    if(
        document.getElementById(
            "supprimerCompte"
        )
    ){

        return;

    }


    const container =
        document.createElement(
            "div"
        );


    container.id =
        "suppressionCompteContainer";


    const bouton =
        document.createElement(
            "button"
        );


    bouton.type =
        "button";


    bouton.id =
        "supprimerCompte";


    bouton.textContent =
        "🗑️ Supprimer mon compte";


    bouton.addEventListener(
        "click",
        supprimerCompte
    );


    container.appendChild(
        bouton
    );


    if(
        saveProfile &&
        saveProfile.parentElement
    ){

        saveProfile.parentElement.appendChild(
            container
        );

    }

}


/* =========================================================
   SUPPRIMER SOUS-COLLECTION
========================================================= */

async function supprimerSousCollection(
    nomCollection
){

    if(
        !utilisateurActuel
    ){

        return;

    }


    const reference =
        collection(
            db,
            "users",
            utilisateurActuel.uid,
            nomCollection
        );


    const snapshot =
        await getDocs(
            reference
        );


    const suppressions = [];


    snapshot.forEach(
        documentSnapshot=>{

            suppressions.push(
                deleteDoc(
                    doc(
                        db,
                        "users",
                        utilisateurActuel.uid,
                        nomCollection,
                        documentSnapshot.id
                    )
                )
            );

        }
    );


    await Promise.all(
        suppressions
    );

}


/* =========================================================
   SUPPRIMER COMPTE
========================================================= */

async function supprimerCompte(){

    if(
        !utilisateurActuel
    ){

        alert(
            "Aucun utilisateur connecté."
        );

        return;

    }


    /*
       ==========================================
       PREMIERE CONFIRMATION
       ==========================================
    */

    const confirmation =
        confirm(

            "⚠️ SUPPRESSION DU COMPTE\n\n" +

            "Cette action est définitive.\n\n" +

            "Ton profil et les données associées " +
            "à ton compte seront supprimés.\n\n" +

            "Veux-tu vraiment continuer ?"

        );


    if(
        !confirmation
    ){

        return;

    }


    /*
       ==========================================
       DEUXIEME CONFIRMATION
       ==========================================
    */

    const verification =
        prompt(

            "Dernière vérification.\n\n" +

            "Pour confirmer la suppression de ton compte,\n" +

            "écris exactement :\n\n" +

            "SUPPRIMER"

        );


    if(
        verification !== "SUPPRIMER"
    ){

        alert(
            "Suppression annulée."
        );

        return;

    }


    /*
       ==========================================
       TROISIEME CONFIRMATION
       ==========================================
    */

    const derniereConfirmation =
        confirm(

            "🚨 DERNIÈRE CONFIRMATION 🚨\n\n" +

            "Ton compte va être supprimé définitivement.\n\n" +

            "Cette action ne pourra pas être annulée.\n\n" +

            "Supprimer définitivement ton compte ?"

        );


    if(
        !derniereConfirmation
    ){

        return;

    }


    const bouton =
        document.getElementById(
            "supprimerCompte"
        );


    if(bouton){

        bouton.disabled =
            true;

        bouton.textContent =
            "⏳ Vérification...";

    }


    try{

        /*
           =================================================
           ETAPE 1
           Vérifier d'abord que Firebase permet réellement
           de supprimer le compte.
           =================================================
        */

        /*
           On effectue une tentative de suppression
           uniquement après toutes les confirmations.

           IMPORTANT :
           Si Firebase demande une reconnexion récente,
           aucune donnée Firestore n'est supprimée avant.
        */

        if(bouton){

            bouton.textContent =
                "⏳ Suppression du compte...";

        }


        /*
           =================================================
           ETAPE 2
           SUPPRESSION DU COMPTE AUTHENTIFICATION
           =================================================
        */

        await deleteUser(
            utilisateurActuel
        );


        /*
           Si on arrive ici, le compte Firebase Auth
           a bien été supprimé.
        */


        console.log(
            "Compte Firebase Authentication supprimé."
        );


        /*
           =================================================
           ETAPE 3
           SUPPRESSION DU PROFIL FIRESTORE
           =================================================
        */

        const uid =
            utilisateurActuel.uid;


        const profilRef =
            doc(
                db,
                "users",
                uid
            );


        await deleteDoc(
            profilRef
        );


        console.log(
            "Document users supprimé."
        );


        /*
           =================================================
           ETAPE 4
           SUPPRESSION DES SOUS-COLLECTIONS
           =================================================
        */

        /*
           Le compte Auth étant déjà supprimé,
           l'utilisateur ne pourra normalement plus
           accéder à ces données.

           On tente néanmoins de nettoyer les sous-collections
           prévues si les règles Firestore l'autorisent.
        */

        try{

            /*
               Il est possible que Firebase refuse ici
               car l'utilisateur n'est plus authentifié.

               Dans ce cas, on ne bloque pas la redirection.
            */

            await supprimerSousCollection(
                "likes"
            );

        }

        catch(error){

            console.warn(
                "Impossible de supprimer la sous-collection likes :",
                error
            );

        }


        try{

            await supprimerSousCollection(
                "favoris"
            );

        }

        catch(error){

            console.warn(
                "Impossible de supprimer la sous-collection favoris :",
                error
            );

        }


        /*
           =================================================
           ETAPE 5
           REDIRECTION
           =================================================
        */

        alert(
            "✅ Ton compte a été supprimé avec succès."
        );


        window.location.href =
            "index.html";

    }

    catch(error){

        console.error(
            "Erreur suppression compte :",
            error
        );


        /*
           ==========================================
           REAUTHENTIFICATION NECESSAIRE
           ==========================================
        */

        if(
            error.code ===
            "auth/requires-recent-login"
        ){

            alert(

                "🔐 Firebase demande une reconnexion récente " +
                "pour supprimer ton compte.\n\n" +

                "Ton compte n'a pas été supprimé.\n\n" +

                "Reconnecte-toi puis réessaie."

            );

        }

        else{

            alert(

                "❌ Impossible de supprimer ton compte.\n\n" +

                (
                    error.message ||
                    "Une erreur inconnue est survenue."
                )

            );

        }


        if(bouton){

            bouton.disabled =
                false;

            bouton.textContent =
                "🗑️ Supprimer mon compte";

        }

    }

}


/* =========================================================
   DECONNEXION
========================================================= */

if(
    deconnexion
){

    deconnexion.addEventListener(
        "click",
        async()=>{

            try{

                await signOut(
                    auth
                );


                window.location.href =
                    "index.html";

            }

            catch(error){

                console.error(
                    "Erreur déconnexion :",
                    error
                );


                alert(
                    "Impossible de se déconnecter."
                );

            }

        }
    );

}


/* =========================================================
   AUTHENTIFICATION
========================================================= */

onAuthStateChanged(
    auth,
    async(user)=>{

        utilisateurActuel =
            user;


        if(!user){

            alert(
                "Tu dois être connecté pour créer ton profil."
            );


            window.location.href =
                "index.html";


            return;

        }


        console.log(
            "Utilisateur connecté :",
            user.uid
        );


        afficherPhotoUtilisateur(
            user
        );


        await chargerProfilExistant();


        await chargerCategories();

    }
);


/* =========================================================
   CHARGER PROFIL EXISTANT
========================================================= */

async function chargerProfilExistant(){

    if(
        !utilisateurActuel
    ){

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
            profilSnap.exists()
        ){

            profilExiste =
                true;


            const data =
                profilSnap.data();


            if(pseudo){

                pseudo.value =
                    data.pseudo ||
                    "";

            }


            if(descriptionCourte){

                descriptionCourte.value =
                    data.descriptionCourte ||
                    "";

            }


            if(descriptionLongue){

                descriptionLongue.value =
                    data.descriptionLongue ||
                    "";

            }


            if(videoYoutube){

                videoYoutube.value =
                    data.videoYoutube ||
                    "";

            }


            if(
                Array.isArray(
                    data.categories
                )
            ){

                categoriesSelectionnees =
                    [
                        ...data.categories
                    ];

            }


            if(
                Array.isArray(
                    data.reseaux
                )
            ){

                data.reseaux.forEach(
                    reseau=>{

                        ajouterBlocReseau(
                            reseau.type ||
                            "",

                            reseau.lien ||
                            ""
                        );

                    }
                );

            }


            if(saveProfile){

                saveProfile.textContent =
                    "💾 Enregistrer les modifications";

            }


            /*
               PROFIL EXISTANT :
               CREATION DU BOUTON
            */

            creerBoutonSuppression();

        }

        else{

            profilExiste =
                false;

        }


        afficherCategoriesSelectionnees();

    }

    catch(error){

        console.error(
            "Erreur chargement profil :",
            error
        );

    }

}


/* =========================================================
   NORMALISER GROUPE
========================================================= */

function normaliserGroupe(nom){

    if(!nom){

        return null;

    }


    const valeur =
        nom
            .toString()
            .trim()
            .toLowerCase()
            .replace(
                /[\s-]+/g,
                "_"
            );


    if(
        valeur === "contenu"
    ){

        return "Contenu";

    }


    if(
        valeur === "creation" ||
        valeur === "création"
    ){

        return "creation";

    }


    if(
        valeur === "jeux_video" ||
        valeur === "jeux_videos" ||
        valeur === "jeux vidéo" ||
        valeur === "jeux vidéos"
    ){

        return "jeux_video";

    }


    if(
        valeur === "musique"
    ){

        return "musique";

    }


    if(
        valeur === "sport"
    ){

        return "sport";

    }


    if(
        valeur === "technologie" ||
        valeur === "tech"
    ){

        return "technologie";

    }


    return null;

}


/* =========================================================
   CHARGER CATEGORIES
========================================================= */

async function chargerCategories(){

    if(
        !categoriesContainer
    ){

        return;

    }


    categoriesContainer.innerHTML = `

        <p style="
            color:#888;
            text-align:center;
            padding:15px;
        ">
            Chargement des catégories...
        </p>

    `;


    try{

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "categories"
                )
            );


        categoriesParGroupe = {

            Contenu: [],
            creation: [],
            jeux_video: [],
            musique: [],
            sport: [],
            technologie: []

        };


        snapshot.forEach(
            categorieDoc=>{

                const data =
                    categorieDoc.data();


                const groupe =
                    normaliserGroupe(
                        data.groupe ||
                        data.categorie ||
                        data.type ||
                        categorieDoc.id
                    );


                if(!groupe){

                    return;

                }


                if(
                    Array.isArray(
                        data.liste
                    )
                ){

                    data.liste.forEach(
                        categorie=>{

                            ajouterCategorieAuGroupe(
                                groupe,
                                categorie
                            );

                        }
                    );

                }


                if(
                    Array.isArray(
                        data.categories
                    )
                ){

                    data.categories.forEach(
                        categorie=>{

                            ajouterCategorieAuGroupe(
                                groupe,
                                categorie
                            );

                        }
                    );

                }

            }
        );


        supprimerDoublonsCategories();


        afficherToutesLesCategories();

    }

    catch(error){

        console.error(
            "Erreur chargement catégories :",
            error
        );


        categoriesContainer.innerHTML = `

            <p style="
                color:#ff6b6b;
                text-align:center;
                padding:15px;
            ">
                Impossible de charger les catégories.
            </p>

        `;

    }

}


/* =========================================================
   AJOUTER CATEGORIE
========================================================= */

function ajouterCategorieAuGroupe(
    groupe,
    categorie
){

    if(!categorie){

        return;

    }


    if(
        typeof categorie ===
        "string"
    ){

        categoriesParGroupe[groupe].push({

            id:
                categorie,

            nom:
                categorie

        });


        return;

    }


    if(
        typeof categorie ===
        "object"
    ){

        const id =
            categorie.id ||
            categorie.nom ||
            categorie.name;


        const nom =
            categorie.nom ||
            categorie.name ||
            categorie.id;


        if(id){

            categoriesParGroupe[groupe].push({

                id:
                    id,

                nom:
                    nom ||
                    id

            });

        }

    }

}


/* =========================================================
   SUPPRIMER DOUBLONS
========================================================= */

function supprimerDoublonsCategories(){

    Object.keys(
        categoriesParGroupe
    )
    .forEach(
        groupe=>{

            const dejaVu =
                new Set();


            categoriesParGroupe[groupe] =
                categoriesParGroupe[groupe]
                    .filter(
                        categorie=>{

                            if(
                                !categorie.id ||
                                dejaVu.has(
                                    categorie.id
                                )
                            ){

                                return false;

                            }


                            dejaVu.add(
                                categorie.id
                            );


                            return true;

                        }
                    );

        }
    );

}


/* =========================================================
   AFFICHER TOUTES LES CATEGORIES
========================================================= */

function afficherToutesLesCategories(){

    if(
        !categoriesContainer
    ){

        return;

    }


    categoriesContainer.innerHTML =
        "";


    const groupes = [

        {
            id:
                "Contenu",

            titre:
                "🎬 Contenu"
        },

        {
            id:
                "creation",

            titre:
                "🎨 Création"
        },

        {
            id:
                "jeux_video",

            titre:
                "🎮 Jeux vidéo"
        },

        {
            id:
                "musique",

            titre:
                "🎵 Musique"
        },

        {
            id:
                "sport",

            titre:
                "⚽ Sport"
        },

        {
            id:
                "technologie",

            titre:
                "💻 Technologie"
        }

    ];


    groupes.forEach(
        groupe=>{

            const bloc =
                document.createElement(
                    "div"
                );


            bloc.className =
                "categorie-groupe";


            const titre =
                document.createElement(
                    "h3"
                );


            titre.className =
                "categorie-groupe-titre";


            titre.textContent =
                groupe.titre;


            /*
               UNE BARRE DE RECHERCHE
               POUR CE GROUPE UNIQUEMENT
            */

            const recherche =
                document.createElement(
                    "input"
                );


            recherche.type =
                "search";


            recherche.className =
                "recherche-categorie";


            recherche.placeholder =
                "🔎 Rechercher une catégorie...";


            recherche.autocomplete =
                "off";


            const liste =
                document.createElement(
                    "div"
                );


            liste.className =
                "categories-liste";


            bloc.appendChild(
                titre
            );


            bloc.appendChild(
                recherche
            );


            bloc.appendChild(
                liste
            );


            categoriesContainer.appendChild(
                bloc
            );


            function afficherGroupe(){

                const rechercheValeur =
                    recherche.value
                        .trim()
                        .toLowerCase();


                liste.innerHTML =
                    "";


                const categories =
                    categoriesParGroupe[
                        groupe.id
                    ] ||
                    [];


                const resultats =
                    categories.filter(
                        categorie=>{

                            return categorie.nom
                                .toLowerCase()
                                .includes(
                                    rechercheValeur
                                );

                        }
                    );


                if(
                    resultats.length ===
                    0
                ){

                    const aucun =
                        document.createElement(
                            "p"
                        );


                    aucun.className =
                        "categories-aucun-resultat";


                    aucun.textContent =
                        rechercheValeur

                        ? "Aucune catégorie trouvée."

                        : "Aucune catégorie disponible.";


                    liste.appendChild(
                        aucun
                    );


                    return;

                }


                resultats.forEach(
                    categorie=>{

                        const bouton =
                            document.createElement(
                                "button"
                            );


                        bouton.type =
                            "button";


                        bouton.className =
                            "categorie";


                        bouton.textContent =
                            categorie.nom;


                        if(
                            categoriesSelectionnees
                                .includes(
                                    categorie.id
                                )
                        ){

                            bouton.classList.add(
                                "selectionnee"
                            );

                        }


                        bouton.addEventListener(
                            "click",
                            ()=>{

                                basculerCategorie(
                                    categorie.id
                                );


                                afficherGroupe();

                            }
                        );


                        liste.appendChild(
                            bouton
                        );

                    }
                );

            }


            recherche.addEventListener(
                "input",
                afficherGroupe
            );


            afficherGroupe();

        }
    );

}


/* =========================================================
   SELECTIONNER / DESELECTIONNER
========================================================= */

function basculerCategorie(
    valeur
){

    if(
        categoriesSelectionnees
            .includes(
                valeur
            )
    ){

        categoriesSelectionnees =
            categoriesSelectionnees.filter(
                categorie =>
                    categorie !== valeur
            );

    }

    else{

        categoriesSelectionnees.push(
            valeur
        );

    }


    afficherCategoriesSelectionnees();

}


/* =========================================================
   AFFICHER CATEGORIES SELECTIONNEES
========================================================= */

function afficherCategoriesSelectionnees(){

    if(
        !categoriesSelectionneesContainer
    ){

        return;

    }


    categoriesSelectionneesContainer.innerHTML =
        "";


    if(
        categoriesSelectionnees.length ===
        0
    ){

        categoriesSelectionneesContainer.innerHTML = `

            <span style="
                color:#777;
                font-size:14px;
            ">
                Aucune catégorie sélectionnée.
            </span>

        `;


        return;

    }


    categoriesSelectionnees.forEach(
        categorie=>{

            const tag =
                document.createElement(
                    "div"
                );


            tag.className =
                "categorie-selectionnee";


            tag.textContent =
                "🏷️ " +
                categorie;


            tag.title =
                "Cliquer pour retirer";


            tag.addEventListener(
                "click",
                ()=>{

                    basculerCategorie(
                        categorie
                    );


                    afficherToutesLesCategories();

                }
            );


            categoriesSelectionneesContainer.appendChild(
                tag
            );

        }
    );

}


/* =========================================================
   RESEAUX
========================================================= */

if(
    ajouterReseau
){

    ajouterReseau.addEventListener(
        "click",
        ()=>{

            ajouterBlocReseau();

        }
    );

}


function ajouterBlocReseau(
    typeValeur = "",
    lienValeur = ""
){

    if(
        !reseaux
    ){

        return;

    }


    const bloc =
        document.createElement(
            "div"
        );


    bloc.className =
        "blocReseau";


    const type =
        document.createElement(
            "input"
        );


    type.type =
        "text";


    type.placeholder =
        "Réseau";


    type.value =
        typeValeur;


    type.style.flex =
        "0 0 30%";


    const lien =
        document.createElement(
            "input"
        );


    lien.type =
        "url";


    lien.placeholder =
        "https://...";


    lien.value =
        lienValeur;


    lien.style.flex =
        "1";


    const supprimer =
        document.createElement(
            "button"
        );


    supprimer.type =
        "button";


    supprimer.textContent =
        "✕";


    supprimer.title =
        "Supprimer ce réseau";


    supprimer.addEventListener(
        "click",
        ()=>{

            bloc.remove();

        }
    );


    bloc.appendChild(
        type
    );


    bloc.appendChild(
        lien
    );


    bloc.appendChild(
        supprimer
    );


    reseaux.appendChild(
        bloc
    );

}


/* =========================================================
   RECUPERER RESEAUX
========================================================= */

function recupererReseaux(){

    if(
        !reseaux
    ){

        return [];

    }


    const resultat =
        [];


    reseaux
        .querySelectorAll(
            ".blocReseau"
        )
        .forEach(
            bloc=>{

                const inputs =
                    bloc.querySelectorAll(
                        "input"
                    );


                if(
                    inputs.length <
                    2
                ){

                    return;

                }


                const type =
                    inputs[0]
                        .value
                        .trim();


                const lien =
                    inputs[1]
                        .value
                        .trim();


                if(
                    type ||
                    lien
                ){

                    resultat.push({

                        type:
                            type,

                        lien:
                            lien

                    });

                }

            }
        );


    return resultat;

}


/* =========================================================
   VERIFICATION PSEUDO
========================================================= */

if(
    pseudo
){

    pseudo.addEventListener(
        "input",
        async()=>{

            const valeur =
                pseudo.value
                    .trim();


            if(
                !pseudoEtat
            ){

                return;

            }


            if(
                !valeur
            ){

                pseudoEtat.textContent =
                    "";

                return;

            }


            if(
                valeur.length <
                3
            ){

                pseudoEtat.textContent =
                    "⚠️ Le pseudo doit contenir au moins 3 caractères.";


                pseudoEtat.style.color =
                    "#ffb347";


                return;

            }


            try{

                const q =
                    query(
                        collection(
                            db,
                            "users"
                        ),

                        where(
                            "pseudo",
                            "==",
                            valeur
                        )
                    );


                const snapshot =
                    await getDocs(
                        q
                    );


                let utilise =
                    false;


                snapshot.forEach(
                    profilDoc=>{

                        if(
                            !utilisateurActuel ||
                            profilDoc.id !==
                            utilisateurActuel.uid
                        ){

                            utilise =
                                true;

                        }

                    }
                );


                if(
                    utilise
                ){

                    pseudoEtat.textContent =
                        "❌ Ce pseudo est déjà utilisé.";


                    pseudoEtat.style.color =
                        "#ff5252";

                }

                else{

                    pseudoEtat.textContent =
                        "✅ Ce pseudo est disponible.";


                    pseudoEtat.style.color =
                        "#4caf50";

                }

            }

            catch(error){

                console.error(
                    "Erreur vérification pseudo :",
                    error
                );

            }

        }
    );

}


/* =========================================================
   YOUTUBE
========================================================= */

function verifierYoutube(
    url
){

    if(
        !url
    ){

        return true;

    }


    return (
        url.includes(
            "youtube.com"
        ) ||

        url.includes(
            "youtu.be"
        )
    );

}


/* =========================================================
   ENREGISTRER LE PROFIL
========================================================= */

if(
    saveProfile
){

    saveProfile.addEventListener(
        "click",
        async()=>{

            if(
                !utilisateurActuel
            ){

                alert(
                    "Tu dois être connecté."
                );


                return;

            }


            const pseudoValeur =
                pseudo
                    ? pseudo.value.trim()
                    : "";


            if(
                !pseudoValeur
            ){

                alert(
                    "Veuillez choisir un pseudo."
                );


                pseudo?.focus();


                return;

            }


            if(
                pseudoValeur.length <
                3
            ){

                alert(
                    "Le pseudo doit contenir au moins 3 caractères."
                );


                pseudo?.focus();


                return;

            }


            const courte =
                descriptionCourte
                    ? descriptionCourte.value.trim()
                    : "";


            const longue =
                descriptionLongue
                    ? descriptionLongue.value.trim()
                    : "";


            const video =
                videoYoutube
                    ? videoYoutube.value.trim()
                    : "";


            if(
                !verifierYoutube(
                    video
                )
            ){

                alert(
                    "Veuillez entrer un lien YouTube valide."
                );


                videoYoutube?.focus();


                return;

            }


            /*
               ==========================================
               VERIFIER PSEUDO
               ==========================================
            */

            try{

                const q =
                    query(
                        collection(
                            db,
                            "users"
                        ),

                        where(
                            "pseudo",
                            "==",
                            pseudoValeur
                        )
                    );


                const snapshot =
                    await getDocs(
                        q
                    );


                let dejaUtilise =
                    false;


                snapshot.forEach(
                    profilDoc=>{

                        if(
                            profilDoc.id !==
                            utilisateurActuel.uid
                        ){

                            dejaUtilise =
                                true;

                        }

                    }
                );


                if(
                    dejaUtilise
                ){

                    alert(
                        "Ce pseudo est déjà utilisé."
                    );


                    return;

                }

            }

            catch(error){

                console.error(
                    error
                );


                alert(
                    "Impossible de vérifier le pseudo."
                );


                return;

            }


            /*
               ==========================================
               DONNEES
               ==========================================
            */

            const donneesProfil = {

                uid:
                    utilisateurActuel.uid,

                pseudo:
                    pseudoValeur,

                email:
                    utilisateurActuel.email ||
                    "",

                photo:
                    utilisateurActuel.photoURL ||
                    "",

                descriptionCourte:
                    courte,

                descriptionLongue:
                    longue,

                reseaux:
                    recupererReseaux(),

                videoYoutube:
                    video,

                categories:
                    [
                        ...categoriesSelectionnees
                    ],

                dateCreation:
                    new Date()

            };


            /*
               ==========================================
               SAUVEGARDE
               ==========================================
            */

            try{

                saveProfile.disabled =
                    true;


                saveProfile.textContent =
                    "⏳ Enregistrement...";


                const profilRef =
                    doc(
                        db,
                        "users",
                        utilisateurActuel.uid
                    );


                await setDoc(
                    profilRef,
                    donneesProfil,
                    {
                        merge:
                            true
                    }
                );


                saveProfile.textContent =
                    "✅ Profil enregistré !";


                setTimeout(
                    ()=>{

                        window.location.href =
                            "profil.html?pseudo=" +
                            encodeURIComponent(
                                pseudoValeur
                            );

                    },
                    1000
                );

            }

            catch(error){

                console.error(
                    "Erreur sauvegarde profil :",
                    error
                );


                alert(
                    "Une erreur est survenue lors de l'enregistrement."
                );


                saveProfile.disabled =
                    false;


                saveProfile.textContent =
                    profilExiste

                    ? "💾 Enregistrer les modifications"

                    : "💾 Créer mon profil";

            }

        }
    );

}


/* =========================================================
   FIN
========================================================= */

console.log(
    "Système de création de profil prêt."
);