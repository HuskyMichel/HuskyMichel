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


/* =========================================================
   ELEMENTS
========================================================= */

const listeLikers =
    document.getElementById("listeLikers");

const titreProfil =
    document.getElementById("titreProfil");

const nombreLikers =
    document.getElementById("nombreLikers");

const aucunLiker =
    document.getElementById("aucunLiker");

const retourProfil =
    document.getElementById("retourProfil");


/* =========================================================
   PSEUDO DU PROFIL
========================================================= */

const params =
    new URLSearchParams(
        window.location.search
    );

const pseudoRecherche =
    params.get("pseudo");


/* =========================================================
   RETOUR AU PROFIL
========================================================= */

if(retourProfil){

    retourProfil.addEventListener(
        "click",
        ()=>{

            if(!pseudoRecherche){

                window.location.href =
                    "index.html";

                return;

            }

            window.location.href =
                "profil.html?pseudo=" +
                encodeURIComponent(
                    pseudoRecherche
                );

        }
    );

}


/* =========================================================
   CHARGER LES LIKES
========================================================= */

async function chargerLikers(){

    if(!pseudoRecherche){

        afficherErreur();

        return;

    }


    try{

        /*
         * Système actuel :
         *
         * users/{pseudo}/likes/{uid}
         */

        const likesRef =
            collection(
                db,
                "users",
                pseudoRecherche,
                "likes"
            );


        const likesSnapshot =
            await getDocs(
                likesRef
            );


        const nombre =
            likesSnapshot.size;


        /* =================================================
           TITRE
        ================================================= */

        if(titreProfil){

            titreProfil.textContent =
                "Personnes qui aiment " +
                pseudoRecherche;

        }


        if(nombreLikers){

            nombreLikers.textContent =
                nombre +
                (
                    nombre > 1
                        ? " personnes aiment ce profil"
                        : " personne aime ce profil"
                );

        }


        /* =================================================
           AUCUN LIKE
        ================================================= */

        if(
            likesSnapshot.empty
        ){

            if(aucunLiker){

                aucunLiker.style.display =
                    "block";

            }

            if(listeLikers){

                listeLikers.innerHTML =
                    "";

            }

            return;

        }


        if(aucunLiker){

            aucunLiker.style.display =
                "none";

        }


        if(listeLikers){

            listeLikers.innerHTML =
                "";

        }


        /* =================================================
           CHARGER CHAQUE PERSONNE
        ================================================= */

        for(
            const likeDoc
            of likesSnapshot.docs
        ){

            const uid =
                likeDoc.id;


            try{

                const utilisateurRef =
                    doc(
                        db,
                        "users",
                        uid
                    );


                const utilisateurSnap =
                    await getDoc(
                        utilisateurRef
                    );


                if(
                    !utilisateurSnap.exists()
                ){

                    continue;

                }


                const data =
                    utilisateurSnap.data();


                /* =================================================
                   CARTE
                ================================================= */

                const carte =
                    document.createElement(
                        "div"
                    );


                carte.className =
                    "carteLiker";


                /* =================================================
                   PHOTO
                ================================================= */

                const image =
                    document.createElement(
                        "img"
                    );


                image.className =
                    "carteLikerPhoto";


                image.src =
                    data.photo ||
                    "Photo de profil/titre.jpg";


                image.alt =
                    data.pseudo ||
                    "Utilisateur";


                image.loading =
                    "lazy";


                /* =================================================
                   INFORMATIONS
                ================================================= */

                const contenu =
                    document.createElement(
                        "div"
                    );


                contenu.className =
                    "carteLikerInfos";


                const nom =
                    document.createElement(
                        "div"
                    );


                nom.className =
                    "carteLikerPseudo";


                nom.textContent =
                    data.pseudo ||
                    "Utilisateur";


                contenu.appendChild(
                    nom
                );


                /* =================================================
                   FLECHE
                ================================================= */

                const fleche =
                    document.createElement(
                        "div"
                    );


                fleche.className =
                    "carteLikerFleche";


                fleche.textContent =
                    "›";


                /* =================================================
                   ASSEMBLAGE
                ================================================= */

                carte.appendChild(
                    image
                );


                carte.appendChild(
                    contenu
                );


                carte.appendChild(
                    fleche
                );


                /* =================================================
                   CLIC
                ================================================= */

                carte.addEventListener(
                    "click",
                    ()=>{

                        if(
                            data.pseudo
                        ){

                            window.location.href =
                                "profil.html?pseudo=" +
                                encodeURIComponent(
                                    data.pseudo
                                );

                        }

                    }
                );


                if(listeLikers){

                    listeLikers.appendChild(
                        carte
                    );

                }

            }

            catch(error){

                console.error(
                    "Impossible de charger le liker :",
                    error
                );

            }

        }

    }

    catch(error){

        console.error(
            "Erreur lors du chargement des likes :",
            error
        );

        afficherErreur();

    }

}


/* =========================================================
   ERREUR
========================================================= */

function afficherErreur(){

    if(titreProfil){

        titreProfil.textContent =
            "Profil introuvable";

    }


    if(nombreLikers){

        nombreLikers.textContent =
            "";

    }


    if(listeLikers){

        listeLikers.innerHTML =
            "";

    }


    if(aucunLiker){

        aucunLiker.style.display =
            "block";

        aucunLiker.innerHTML = `

            <div class="aucunLikerIcon">
                ❌
            </div>

            <h2>
                Impossible de charger les likes
            </h2>

            <p>
                Retourne au profil et réessaie.
            </p>

        `;

    }

}


/* =========================================================
   LANCEMENT
========================================================= */

chargerLikers();