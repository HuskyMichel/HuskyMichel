import { db } from "./firebase.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";


/* =========================================================
   ELEMENTS
========================================================= */

const listeClassement =
    document.getElementById("listeClassement");

const nombreProfils =
    document.getElementById("nombreProfils");


/* =========================================================
   MEDAILLES
========================================================= */

function obtenirMedaille(position){

    if(position === 1) return "🥇";

    if(position === 2) return "🥈";

    if(position === 3) return "🥉";

    return position + "e";

}


/* =========================================================
   CHARGER LE CLASSEMENT
========================================================= */

async function chargerClassementLikes(){

    try{

        listeClassement.innerHTML = `
            <p class="messageClassement">
                Chargement du classement...
            </p>
        `;


        /* ==============================================
           RECUPERER TOUS LES PROFILS
        ============================================== */

        const profilsSnapshot =
            await getDocs(
                collection(db, "users")
            );


        const profils = [];


        /* ==============================================
           RECUPERER LES LIKES DE CHAQUE PROFIL
        ============================================== */

        const lecturesLikes =
            profilsSnapshot.docs.map(
                async(profilDoc)=>{

                    const data =
                        profilDoc.data();

                    const pseudo =
                        data.pseudo || "";


                    if(!pseudo){
                        return null;
                    }


                    const likesSnapshot =
                        await getDocs(
                            collection(
                                db,
                                "users",
                                pseudo,
                                "likes"
                            )
                        );


                    return {

                        uid: profilDoc.id,

                        pseudo: pseudo,

                        photo: data.photo || "",

                        likes: likesSnapshot.size

                    };

                }
            );


        const resultats =
            await Promise.all(
                lecturesLikes
            );


        /* ==============================================
           FILTRER ET TRIER
        ============================================== */

        const classement =
            resultats
                .filter(profil => profil !== null)
                .sort(
                    (a, b)=>{

                        return b.likes - a.likes;

                    }
                );


        nombreProfils.textContent =
            classement.length +
            (
                classement.length > 1
                    ? " profils"
                    : " profil"
            );


        listeClassement.innerHTML =
            "";


        /* ==============================================
           AUCUN PROFIL
        ============================================== */

        if(classement.length === 0){

            listeClassement.innerHTML = `
                <p class="messageClassement">
                    Aucun profil à afficher pour le moment.
                </p>
            `;

            return;

        }


        /* ==============================================
           AFFICHER LE CLASSEMENT
        ============================================== */

        classement.forEach(
            (profil, index)=>{

                const position =
                    index + 1;


                const ligne =
                    document.createElement("div");

                ligne.className =
                    "ligneClassement";


                /* POSITION */

                const numero =
                    document.createElement("div");

                numero.className =
                    "positionClassement";

                numero.textContent =
                    obtenirMedaille(position);


                /* PHOTO */

                const image =
                    document.createElement("img");

                image.className =
                    "photoClassement";

                image.src =
                    profil.photo;

                image.alt =
                    profil.pseudo;


                /* INFORMATIONS */

                const informations =
                    document.createElement("div");

                informations.className =
                    "infosClassement";


                const pseudo =
                    document.createElement("div");

                pseudo.className =
                    "pseudoClassement";

                pseudo.textContent =
                    profil.pseudo;


                const sousTitre =
                    document.createElement("div");

                sousTitre.className =
                    "sousTitreClassement";

                sousTitre.textContent =
                    "Position : " + position;


                informations.appendChild(pseudo);

                informations.appendChild(sousTitre);


                /* NOMBRE DE LIKES */

                const likes =
                    document.createElement("div");

                likes.className =
                    "nombreLikes";

                likes.textContent =
                    "❤️ " +
                    profil.likes;


                /* ASSEMBLAGE */

                ligne.appendChild(numero);

                ligne.appendChild(image);

                ligne.appendChild(informations);

                ligne.appendChild(likes);


                /* OUVRIR LE PROFIL */

                ligne.addEventListener(
                    "click",
                    ()=>{

                        window.location.href =
                            "profil.html?pseudo=" +
                            encodeURIComponent(
                                profil.pseudo
                            );

                    }
                );


                listeClassement.appendChild(ligne);

            }
        );

    }

    catch(error){

        console.error(
            "Erreur lors du chargement du classement des likes :",
            error
        );


        listeClassement.innerHTML = `
            <p class="messageClassement">
                Impossible de charger le classement.
                Vérifie les règles de sécurité Firebase.
            </p>
        `;

    }

}


/* =========================================================
   LANCEMENT
========================================================= */

chargerClassementLikes();