import { auth, db } from "./firebase.js";


import {

    GoogleAuthProvider,
    signInWithPopup,
    signOut,
    onAuthStateChanged

} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";


import {

    collection,
    query,
    where,
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
   PARAMETRE PROFIL
========================================================= */

const params =
    new URLSearchParams(
        window.location.search
    );


const pseudoRecherche =
    params.get("pseudo");



/* =========================================================
   MENU COMPTE
========================================================= */

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


document.addEventListener(
    "click",
    (event)=>{

        if(
            !profile.contains(
                event.target
            )
        ){

            menu.style.display =
                "none";

        }

    }
);



/* =========================================================
   CONNEXION
========================================================= */

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



/* =========================================================
   DECONNEXION
========================================================= */

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



/* =========================================================
   ETAT UTILISATEUR
========================================================= */

onAuthStateChanged(
    auth,
    (user)=>{

        if(user){

            loginBtn.style.display =
                "none";

            profile.style.display =
                "block";


            if(user.photoURL){

                avatar.src =
                    user.photoURL.replace(
                        "=s96-c",
                        "=s512-c"
                    );

            }

        }

        else{

            loginBtn.style.display =
                "block";

            profile.style.display =
                "none";

        }

    }
);



/* =========================================================
   RETOUR
========================================================= */

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



/* =========================================================
   CHARGER LES LIKERS
========================================================= */

async function chargerLikers(){

    if(!pseudoRecherche){

        afficherErreur();

        return;

    }


    try{

        /*
           On retrouve le profil
           grâce à son pseudo.
        */

        const profilQuery =
            query(
                collection(
                    db,
                    "users"
                ),

                where(
                    "pseudo",
                    "==",
                    pseudoRecherche
                )
            );


        const profilSnapshot =
            await getDocs(
                profilQuery
            );


        if(
            profilSnapshot.empty
        ){

            afficherErreur();

            return;

        }


        const profilDoc =
            profilSnapshot.docs[0];


        const profilData =
            profilDoc.data();


        const profilUid =
            profilDoc.id;



        /* ==============================================
           TITRE
        ============================================== */

        titreProfil.textContent =
            "Personnes qui aiment " +
            (
                profilData.pseudo ||
                pseudoRecherche
            );



        /* ==============================================
           RECUPERER LES LIKES
        ============================================== */

        const likesRef =
            collection(
                db,
                "users",
                profilUid,
                "likes"
            );


        const likesSnapshot =
            await getDocs(
                likesRef
            );


        const nombre =
            likesSnapshot.size;


        nombreLikers.textContent =
            nombre +
            (
                nombre > 1
                    ? " personnes aiment ce profil"
                    : " personne aime ce profil"
            );



        /* ==============================================
           AUCUN LIKE
        ============================================== */

        if(
            likesSnapshot.empty
        ){

            aucunLiker.style.display =
                "block";

            listeLikers.innerHTML =
                "";

            return;

        }



        /* ==============================================
           CREER LES CARTES
        ============================================== */

        listeLikers.innerHTML =
            "";


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


                const carte =
                    document.createElement(
                        "div"
                    );


                carte.className =
                    "carteLiker";



                /* PHOTO */

                const image =
                    document.createElement(
                        "img"
                    );


                image.className =
                    "carteLikerPhoto";


                image.src =
                    data.photo ||
                    "logo.jpg";


                image.alt =
                    data.pseudo ||
                    "Utilisateur";



                /* INFORMATIONS */

                const infos =
                    document.createElement(
                        "div"
                    );


                infos.className =
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



                const description =
                    document.createElement(
                        "div"
                    );


                description.className =
                    "carteLikerDescription";


                description.textContent =
                    data.descriptionCourte ||
                    "Profil HuskyMichel";



                infos.appendChild(
                    nom
                );


                infos.appendChild(
                    description
                );



                /* FLECHE */

                const fleche =
                    document.createElement(
                        "div"
                    );


                fleche.className =
                    "carteLikerFleche";


                fleche.textContent =
                    "→";



                /* ASSEMBLAGE */

                carte.appendChild(
                    image
                );

                carte.appendChild(
                    infos
                );

                carte.appendChild(
                    fleche
                );



                /* CLIC */

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
            "Erreur chargement likers :",
            error
        );

        afficherErreur();

    }

}



/* =========================================================
   ERREUR
========================================================= */

function afficherErreur(){

    titreProfil.textContent =
        "Profil introuvable";

    nombreLikers.textContent =
        "";

    listeLikers.innerHTML =
        "";

    aucunLiker.style.display =
        "block";

    aucunLiker.innerHTML = `

        ❌

        <h2>
            Impossible de trouver ce profil
        </h2>

        <p>
            Retourne à l'accueil pour choisir
            un autre profil.
        </p>

    `;

}



/* =========================================================
   DEMARRAGE
========================================================= */

chargerLikers();