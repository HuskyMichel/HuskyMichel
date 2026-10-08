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
   MENU
========================================================= */

if(avatar){

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

            menu.style.display =
                "none";

        }

    }
);



/* =========================================================
   CONNEXION
========================================================= */

if(loginBtn){

    const provider =
        new GoogleAuthProvider();


    provider.setCustomParameters({
        prompt:"select_account"
    });


    loginBtn.addEventListener(
        "click",
        async ()=>{

            try{

                await signInWithPopup(
                    auth,
                    provider
                );

            }

            catch(error){

                console.error(
                    "Erreur connexion :",
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
        async ()=>{

            try{

                await signOut(auth);

                menu.style.display =
                    "none";

            }

            catch(error){

                console.error(
                    "Erreur déconnexion :",
                    error
                );

            }

        }
    );

}



/* =========================================================
   ETAT DU COMPTE
========================================================= */

onAuthStateChanged(
    auth,
    (user)=>{

        if(user){

            if(loginBtn){
                loginBtn.style.display =
                    "none";
            }

            if(profile){
                profile.style.display =
                    "block";
            }


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

        }

        else{

            if(loginBtn){
                loginBtn.style.display =
                    "block";
            }

            if(profile){
                profile.style.display =
                    "none";
            }

        }

    }
);



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
         * IMPORTANT :
         *
         * Ton système actuel utilise :
         *
         * users/{pseudo}/likes/{uid}
         *
         * On utilise donc DIRECTEMENT
         * le pseudo comme document parent.
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

        titreProfil.textContent =
            "Personnes qui aiment " +
            pseudoRecherche;


        nombreLikers.textContent =
            nombre +
            (
                nombre > 1
                    ? " personnes aiment ce profil"
                    : " personne aime ce profil"
            );



        /* =================================================
           AUCUN LIKE
        ================================================= */

        if(
            likesSnapshot.empty
        ){

            aucunLiker.style.display =
                "block";

            listeLikers.innerHTML =
                "";

            return;

        }


        aucunLiker.style.display =
            "none";


        listeLikers.innerHTML =
            "";



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



                /* =================================================
                   CONTENU
                ================================================= */

                const contenu =
                    document.createElement(
                        "div"
                    );


                contenu.className =
                    "carteLikerContenu";



                const nom =
                    document.createElement(
                        "div"
                    );


                nom.className =
                    "carteLikerPseudo";


                nom.textContent =
                    data.pseudo ||
                    "Utilisateur";



                const description =
                    document.createElement(
                        "div"
                    );


                description.className =
                    "carteLikerDescription";


                description.textContent =
                    data.descriptionCourte ||
                    "Aucune description";


                contenu.appendChild(
                    nom
                );


                contenu.appendChild(
                    description
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


                listeLikers.appendChild(
                    carte
                );

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

            <div style="font-size:40px;">
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