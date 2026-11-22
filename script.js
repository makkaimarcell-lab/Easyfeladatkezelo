
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

// Aktuális felhasználó
let aktualisFelhasznalo = null;

// Adatbázis figyelők leállítása
let sajatFigyelo = null;
let kozosFigyelo = null;


// GOOGLE BEJELENTKEZÉS
belepesBtn.addEventListener("click", async function() {
    try {
        await signInWithPopup(auth, provider);
    } catch (hiba) {
        console.error("Bejelentkezési hiba:", hiba);
        alert("Nem sikerült a bejelentkezés!");
    }
});


// GOOGLE KIJELENTKEZÉS
kijelentkezesBtn.addEventListener("click", async function() {
    try {
        await signOut(auth);
    } catch (hiba) {
        console.error("Kijelentkezési hiba:", hiba);
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

        // SZÖVEG
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
                alert("Nem sikerült menteni a módosítást!");
            }
        });

        // SZERKESZTÉS DUPLA KATTINTÁSSAL
        szoveg.addEventListener("dblclick", async function() {

            const ujSzoveg = prompt(
                "Írd át a feladatot:",
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
                    alert("Nem sikerült módosítani a feladatot!");
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
                alert("Nem sikerült törölni a feladatot!");
            }
        });

        ujElem.appendChild(pipa);
        ujElem.appendChild(szoveg);
        ujElem.appendChild(torlesGomb);

        lista.appendChild(ujElem);
    });
}


// ÚJ FELADAT HOZZÁADÁSA
function teendoHozzaadas(gombAzonosito, listaAzonosito, gyujtemeny) {

    const gomb = document.getElementById(gombAzonosito);

    gomb.addEventListener("click", async function() {

        if (!aktualisFelhasznalo) {
            alert("Először jelentkezz be Google-fiókoddal!");
            return;
        }

        const feladat = prompt("Mi a teendőd?");

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
                alert("Nem sikerült hozzáadni a feladatot!");
            }
        }
    });
}


// A KÉT LISTA GOMBJAI
teendoHozzaadas(
    "ujTeendoBtn",
    "teendoLista",
    "privateTasks"
);

teendoHozzaadas(
    "ujTeendoBtn2",
    "teendoLista2",
    "sharedTasks"
);


// BEJELENTKEZÉSI ÁLLAPOT FIGYELÉSE
onAuthStateChanged(auth, function(user) {

    aktualisFelhasznalo = user;

    // Korábbi figyelők leállítása
    if (sajatFigyelo) {
        sajatFigyelo();
        sajatFigyelo = null;
    }

    if (kozosFigyelo) {
        kozosFigyelo();
        kozosFigyelo = null;
    }

    // Listák törlése kijelentkezéskor
    document.getElementById("teendoLista").innerHTML = "";
    document.getElementById("teendoLista2").innerHTML = "";

    if (user) {

        felhasznaloNev.textContent =
            "Bejelentkezve: " + user.displayName;

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
