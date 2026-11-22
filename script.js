
import { initializeApp } from "https://www.gstatic.com/firebasejs/13.4.0/firebase-app.js";

import {
    getFirestore,
    collection,
    addDoc,
    deleteDoc,
    doc,
    updateDoc,
    onSnapshot,
    query,
    where,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/13.4.0/firebase-firestore.js";

import {
    getAuth,
    GoogleAuthProvider,
    signInWithPopup,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/13.4.0/firebase-auth.js";

// FIREBASE BEÁLLÍTÁSOK
const firebaseConfig = {
    apiKey: "AIzaSyA92juG_RYS36AZYM9NVoLmlGsDoaIPVx0",
    authDomain: "easy-feladatkezelo.firebaseapp.com",
    projectId: "easy-feladatkezelo",
    storageBucket: "easy-feladatkezelo.firebasestorage.app",
    messagingSenderId: "1083951304432",
    appId: "1:1083951304432:web:aeb8ad3ab1c4c842423c35"
};

// FIREBASE ELINDÍTÁSA
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// HTML ELEMEK
const belepesBtn = document.getElementById("belepesBtn");
const kijelentkezesBtn = document.getElementById("kijelentkezesBtn");
const felhasznaloNev = document.getElementById("felhasznaloNev");
const nyelvValaszto = document.getElementById("nyelvValaszto");

// AKTUÁLIS FELHASZNÁLÓ
let aktualisFelhasznalo = null;

// ADATBÁZIS FIGYELŐK
let sajatFigyelo = null;
let kozosFigyelo = null;

// AKTUÁLIS NYELV
let aktualisNyelv = "hu";


// NYELVI SZÖVEGEK
const szovegek = {

    hu: {
        language: "Nyelv:",
        title: "Teendőim",
        login: "Bejelentkezés Google-fiókkal",
        logout: "Kijelentkezés",
        welcome: "Üdvözöllek a teendőkezelő oldalon!",
        privateTitle: "Saját teendőim",
        sharedTitle: "Közös teendők",
        privateAdd: "+ Új saját teendő",
        sharedAdd: "+ Új közös teendő",

        loggedIn: "Bejelentkezve: ",
        loginError: "Nem sikerült a bejelentkezés!",
        logoutError: "Nem sikerült kijelentkezni!",
        loginFirst: "Először jelentkezz be Google-fiókoddal!",
        newTask: "Mi a teendőd?",
        editTask: "Írd át a feladatot:",
        saveError: "Nem sikerült menteni a módosítást!",
        editError: "Nem sikerült módosítani a feladatot!",
        deleteError: "Nem sikerült törölni a feladatot!",
        addError: "Nem sikerült hozzáadni a feladatot!"
    },

    en: {
        language: "Language:",
        title: "My Tasks",
        login: "Sign in with Google",
        logout: "Sign out",
        welcome: "Welcome to the task manager!",
        privateTitle: "My Private Tasks",
        sharedTitle: "Shared Tasks",
        privateAdd: "+ Add Private Task",
        sharedAdd: "+ Add Shared Task",

        loggedIn: "Signed in as: ",
        loginError: "Could not sign in!",
        logoutError: "Could not sign out!",
        loginFirst: "Please sign in with your Google account first!",
        newTask: "What do you need to do?",
        editTask: "Edit the task:",
        saveError: "Could not save the changes!",
        editError: "Could not edit the task!",
        deleteError: "Could not delete the task!",
        addError: "Could not add the task!"
    },

    pl: {
        language: "Język:",
        title: "Moje zadania",
        login: "Zaloguj się przez Google",
        logout: "Wyloguj się",
        welcome: "Witamy w menedżerze zadań!",
        privateTitle: "Moje prywatne zadania",
        sharedTitle: "Wspólne zadania",
        privateAdd: "+ Dodaj prywatne zadanie",
        sharedAdd: "+ Dodaj wspólne zadanie",

        loggedIn: "Zalogowano jako: ",
        loginError: "Nie udało się zalogować!",
        logoutError: "Nie udało się wylogować!",
        loginFirst: "Najpierw zaloguj się przez konto Google!",
        newTask: "Co masz do zrobienia?",
        editTask: "Edytuj zadanie:",
        saveError: "Nie udało się zapisać zmian!",
        editError: "Nie udało się edytować zadania!",
        deleteError: "Nie udało się usunąć zadania!",
        addError: "Nie udało się dodać zadania!"
    }

};


// NYELV BEÁLLÍTÁSA
function nyelvBeallitasa(nyelv) {

    aktualisNyelv = nyelv;

    const szoveg = szovegek[nyelv];

    // HTML NYELVÉNEK BEÁLLÍTÁSA
    document.documentElement.lang = nyelv;

    // ÁLLANDÓ SZÖVEGEK FORDÍTÁSA
    document.querySelectorAll("[data-i18n]").forEach(function(elem) {

        const kulcs = elem.getAttribute("data-i18n");

        if (szoveg[kulcs]) {
            elem.textContent = szoveg[kulcs];
        }

    });

    // BEJELENTKEZETT FELHASZNÁLÓ NEVE
    if (aktualisFelhasznalo) {

        felhasznaloNev.textContent =
            szoveg.loggedIn + aktualisFelhasznalo.displayName;

    }

}


// NYELVVÁLTÓ MŰKÖDÉSE
nyelvValaszto.addEventListener("change", function() {

    nyelvBeallitasa(nyelvValaszto.value);

});


// ALAPÉRTELMEZETT NYELV
nyelvBeallitasa("hu");


// GOOGLE BEJELENTKEZÉS
belepesBtn.addEventListener("click", async function() {

    try {

        await signInWithPopup(auth, provider);

    } catch (hiba) {

        console.error("Bejelentkezési hiba:", hiba);

        alert(szovegek[aktualisNyelv].loginError);

    }

});


// GOOGLE KIJELENTKEZÉS
kijelentkezesBtn.addEventListener("click", async function() {

    try {

        await signOut(auth);

    } catch (hiba) {

        console.error("Kijelentkezési hiba:", hiba);

        alert(szovegek[aktualisNyelv].logoutError);

    }

});


// FELADATLISTA MEGJELENÍTÉSE
function listaMegjelenitese(listaAzonosito, dokumentumok, gyujtemeny) {

    const lista = document.getElementById(listaAzonosito);

    lista.innerHTML = "";

    dokumentumok.forEach(function(dokumentum) {

        const adat = dokumentum.data();

        const ujElem = document.createElement("li");

        // PIPA
        const pipa = document.createElement("input");

        pipa.type = "checkbox";
        pipa.checked = adat.completed || false;

        // FELADAT SZÖVEGE
        const szoveg = document.createElement("span");

        szoveg.textContent = adat.text;

        szoveg.style.textDecoration =
            pipa.checked ? "line-through" : "none";

        // TÖRLÉS GOMB
        const torlesGomb = document.createElement("button");

        torlesGomb.textContent = "X";
        torlesGomb.classList.add("torlesGomb");

        // KIPIPÁLÁS
        pipa.addEventListener("change", async function() {

            try {

                await updateDoc(
                    doc(db, gyujtemeny, dokumentum.id),
                    {
                        completed: pipa.checked
                    }
                );

            } catch (hiba) {

                console.error("Mentési hiba:", hiba);

                alert(szovegek[aktualisNyelv].saveError);

            }

        });

        // SZERKESZTÉS DUPLA KATTINTÁSSAL
        szoveg.addEventListener("dblclick", async function() {

            const ujSzoveg = prompt(
                szovegek[aktualisNyelv].editTask,
                adat.text
            );

            if (ujSzoveg !== null && ujSzoveg.trim() !== "") {

                try {

                    await updateDoc(
                        doc(db, gyujtemeny, dokumentum.id),
                        {
                            text: ujSzoveg.trim()
                        }
                    );

                } catch (hiba) {

                    console.error("Szerkesztési hiba:", hiba);

                    alert(szovegek[aktualisNyelv].editError);

                }

            }

        });

        // TÖRLÉS
        torlesGomb.addEventListener("click", async function() {

            try {

                await deleteDoc(
                    doc(db, gyujtemeny, dokumentum.id)
                );

            } catch (hiba) {

                console.error("Törlési hiba:", hiba);

                alert(szovegek[aktualisNyelv].deleteError);

            }

        });

        ujElem.appendChild(pipa);
        ujElem.appendChild(szoveg);
        ujElem.appendChild(torlesGomb);

        lista.appendChild(ujElem);

    });

}


// ÚJ FELADAT HOZZÁADÁSA
function teendoHozzaadas(gombAzonosito, gyujtemeny) {

    const gomb = document.getElementById(gombAzonosito);

    gomb.addEventListener("click", async function() {

        if (!aktualisFelhasznalo) {

            alert(szovegek[aktualisNyelv].loginFirst);

            return;

        }

        const feladat = prompt(
            szovegek[aktualisNyelv].newTask
        );

        if (feladat !== null && feladat.trim() !== "") {

            try {

                await addDoc(collection(db, gyujtemeny), {

                    text: feladat.trim(),
                    completed: false,
                    ownerUid: aktualisFelhasznalo.uid,
                    createdAt: serverTimestamp()

                });

            } catch (hiba) {

                console.error("Hozzáadási hiba:", hiba);

                alert(szovegek[aktualisNyelv].addError);

            }

        }

    });

}


// A KÉT LISTA GOMBJAI
teendoHozzaadas(
    "ujTeendoBtn",
    "privateTasks"
);

teendoHozzaadas(
    "ujTeendoBtn2",
    "sharedTasks"
);


// BEJELENTKEZÉSI ÁLLAPOT FIGYELÉSE
onAuthStateChanged(auth, function(user) {

    aktualisFelhasznalo = user;

    // KORÁBBI FIGYELŐK LEÁLLÍTÁSA
    if (sajatFigyelo) {

        sajatFigyelo();
        sajatFigyelo = null;

    }

    if (kozosFigyelo) {

        kozosFigyelo();
        kozosFigyelo = null;

    }

    // LISTÁK TÖRLÉSE
    document.getElementById("teendoLista").innerHTML = "";
    document.getElementById("teendoLista2").innerHTML = "";

    if (user) {

        felhasznaloNev.textContent =
            szovegek[aktualisNyelv].loggedIn + user.displayName;

        // SAJÁT FELADATOK FIGYELÉSE
        const sajatLekerdezes = query(
            collection(db, "privateTasks"),
            where("ownerUid", "==", user.uid)
        );

        sajatFigyelo = onSnapshot(
            sajatLekerdezes,

            function(snapshot) {

                listaMegjelenitese(
                    "teendoLista",
                    snapshot.docs,
                    "privateTasks"
                );

            },

            function(hiba) {

                console.error("Saját feladatok hibája:", hiba);

            }
        );


        // KÖZÖS FELADATOK FIGYELÉSE
        kozosFigyelo = onSnapshot(
            collection(db, "sharedTasks"),

            function(snapshot) {

                listaMegjelenitese(
                    "teendoLista2",
                    snapshot.docs,
                    "sharedTasks"
                );

            },

            function(hiba) {

                console.error("Közös feladatok hibája:", hiba);

            }
        );

    } else {

        felhasznaloNev.textContent = "";

    }

});
