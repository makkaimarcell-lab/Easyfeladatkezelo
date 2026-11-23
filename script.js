
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

const ertesitesEngedelyezesBtn =
    document.getElementById("ertesitesEngedelyezesBtn");

const ertesitesAllapot =
    document.getElementById("ertesitesAllapot");


// AKTUÁLIS FELHASZNÁLÓ
let aktualisFelhasznalo = null;


// ADATBÁZIS FIGYELŐK
let sajatFigyelo = null;
let kozosFigyelo = null;


// NYELV
let aktualisNyelv = "hu";


// FELADATOK
let osszesFeladat = [];


// KÖZÖS LISTA ELSŐ BETÖLTÉSE
let kozosElsoBetoltes = true;


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
        addError: "Nem sikerült hozzáadni a feladatot!",

        dateQuestion: "Mikor jár le a feladat? (ÉÉÉÉ-HH-NN)",
        timeQuestion: "Hány órakor jár le? (ÓÓ:PP)",
        invalidDate: "Hibás dátum vagy időpont!",
        pastDate: "A határidőnek a jövőben kell lennie!",
        deadline: "Határidő: ",
        noDeadline: "Nincs határidő",
        reminder60: "1 óra múlva lejár a feladatod: ",
        reminder15: "15 perc múlva lejár a feladatod: ",
        sharedNotification: "Új közös feladat",
        sharedAdded: " új feladatot adott a közös listához: ",
        notificationOn: "Az értesítések engedélyezve vannak.",
        notificationOff: "Az értesítések nincsenek engedélyezve.",
        notificationError: "Nem sikerült engedélyezni az értesítéseket."
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
        loginFirst: "Please sign in first!",
        newTask: "What do you need to do?",
        editTask: "Edit the task:",
        saveError: "Could not save the changes!",
        editError: "Could not edit the task!",
        deleteError: "Could not delete the task!",
        addError: "Could not add the task!",

        dateQuestion: "When is the deadline? (YYYY-MM-DD)",
        timeQuestion: "At what time? (HH:MM)",
        invalidDate: "Invalid date or time!",
        pastDate: "The deadline must be in the future!",
        deadline: "Deadline: ",
        noDeadline: "No deadline",
        reminder60: "Your task is due in 1 hour: ",
        reminder15: "Your task is due in 15 minutes: ",
        sharedNotification: "New shared task",
        sharedAdded: " added a new task to the shared list: ",
        notificationOn: "Notifications are enabled.",
        notificationOff: "Notifications are not enabled.",
        notificationError: "Could not enable notifications."
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
        loginFirst: "Najpierw zaloguj się!",
        newTask: "Co masz do zrobienia?",
        editTask: "Edytuj zadanie:",
        saveError: "Nie udało się zapisać zmian!",
        editError: "Nie udało się edytować zadania!",
        deleteError: "Nie udało się usunąć zadania!",
        addError: "Nie udało się dodać zadania!",

        dateQuestion: "Kiedy upływa termin? (RRRR-MM-DD)",
        timeQuestion: "O której godzinie? (GG:MM)",
        invalidDate: "Nieprawidłowa data lub godzina!",
        pastDate: "Termin musi być w przyszłości!",
        deadline: "Termin: ",
        noDeadline: "Brak terminu",
        reminder60: "Zadanie upływa za godzinę: ",
        reminder15: "Zadanie upływa za 15 minut: ",
        sharedNotification: "Nowe wspólne zadanie",
        sharedAdded: " dodał nowe zadanie do wspólnej listy: ",
        notificationOn: "Powiadomienia są włączone.",
        notificationOff: "Powiadomienia nie są włączone.",
        notificationError: "Nie udało się włączyć powiadomień."
    }

};


// NYELV BEÁLLÍTÁSA
function nyelvBeallitasa(nyelv) {

    aktualisNyelv = nyelv;

    const szoveg = szovegek[nyelv];

    document.documentElement.lang = nyelv;

    document.querySelectorAll("[data-i18n]").forEach(function(elem) {

        const kulcs = elem.getAttribute("data-i18n");

        if (szoveg[kulcs]) {
            elem.textContent = szoveg[kulcs];
        }

    });

    if (aktualisFelhasznalo) {

        felhasznaloNev.textContent =
            szoveg.loggedIn + aktualisFelhasznalo.displayName;

    }

    ertesitesAllapotFrissitese();

}


// NYELVVÁLTÁS
nyelvValaszto.addEventListener("change", function() {

    nyelvBeallitasa(nyelvValaszto.value);

});

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


// KIJELENTKEZÉS
kijelentkezesBtn.addEventListener("click", async function() {

    try {

        await signOut(auth);

    } catch (hiba) {

        console.error("Kijelentkezési hiba:", hiba);
        alert(szovegek[aktualisNyelv].logoutError);

    }

});


// ÉRTESÍTÉSEK ÁLLAPOTA
function ertesitesAllapotFrissitese() {

    if (!("Notification" in window)) {

        ertesitesAllapot.textContent =
            "Ez a böngésző nem támogatja az értesítéseket.";

        return;

    }

    if (Notification.permission === "granted") {

        ertesitesAllapot.textContent =
            szovegek[aktualisNyelv].notificationOn;

    } else {

        ertesitesAllapot.textContent =
            szovegek[aktualisNyelv].notificationOff;

    }

}


// ÉRTESÍTÉSEK ENGEDÉLYEZÉSE
ertesitesEngedelyezesBtn.addEventListener("click", async function() {

    if (!("Notification" in window)) {

        alert("A böngésződ nem támogatja az értesítéseket.");
        return;

    }

    try {

        const engedely = await Notification.requestPermission();

        ertesitesAllapotFrissitese();

        if (engedely !== "granted") {

            alert(szovegek[aktualisNyelv].notificationError);

        }

    } catch (hiba) {

        console.error("Értesítési hiba:", hiba);

    }

});

ertesitesAllapotFrissitese();


// ÉRTESÍTÉS KÜLDÉSE
function ertesitesKuldes(cim, szoveg) {

    if (
        !("Notification" in window) ||
        Notification.permission !== "granted"
    ) {
        return;
    }

    try {

        const ertesites = new Notification(cim, {
            body: szoveg,
            icon: "./favicon.ico"
        });

        ertesites.onclick = function() {

            window.focus();
            ertesites.close();

        };

    } catch (hiba) {

        console.error("Értesítés küldési hiba:", hiba);

    }

}


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

        // HATÁRIDŐ MEGJELENÍTÉSE
        const hatarido = document.createElement("small");

        if (adat.dueAt) {

            const datum = new Date(adat.dueAt);

            hatarido.textContent =
                " | " +
                szovegek[aktualisNyelv].deadline +
                datum.toLocaleString(
                    aktualisNyelv === "hu" ? "hu-HU" :
                    aktualisNyelv === "pl" ? "pl-PL" : "en-GB"
                );

        } else {

            hatarido.textContent =
                " | " + szovegek[aktualisNyelv].noDeadline;

        }

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

        // SZERKESZTÉS
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
        ujElem.appendChild(hatarido);
        ujElem.appendChild(torlesGomb);

        lista.appendChild(ujElem);

    });

}



// DÁTUM- ÉS IDŐVÁLASZTÓ
function datumIdoValasztasa() {

    return new Promise(function(resolve) {

        const dialog = document.createElement("dialog");

        dialog.style.padding = "25px";
        dialog.style.border = "none";
        dialog.style.borderRadius = "12px";
        dialog.style.maxWidth = "350px";
        dialog.style.width = "85%";

        const cim = document.createElement("h2");
        cim.textContent = "Határidő beállítása";

        const datumLabel = document.createElement("label");
        datumLabel.textContent = "Dátum:";
        datumLabel.style.display = "block";
        datumLabel.style.marginTop = "15px";

        const datumInput = document.createElement("input");
        datumInput.type = "date";
        datumInput.required = true;
        datumInput.style.display = "block";
        datumInput.style.width = "100%";
        datumInput.style.boxSizing = "border-box";
        datumInput.style.padding = "10px";

        const idoLabel = document.createElement("label");
        idoLabel.textContent = "Időpont:";
        idoLabel.style.display = "block";
        idoLabel.style.marginTop = "15px";

        const idoInput = document.createElement("input");
        idoInput.type = "time";
        idoInput.required = true;
        idoInput.style.display = "block";
        idoInput.style.width = "100%";
        idoInput.style.boxSizing = "border-box";
        idoInput.style.padding = "10px";

        const gombok = document.createElement("div");
        gombok.style.display = "flex";
        gombok.style.gap = "10px";
        gombok.style.marginTop = "20px";

        const megseGomb = document.createElement("button");
        megseGomb.type = "button";
        megseGomb.textContent = "Mégse";

        const mentesGomb = document.createElement("button");
        mentesGomb.type = "submit";
        mentesGomb.textContent = "Mentés";

        const form = document.createElement("form");

        form.appendChild(cim);
        form.appendChild(datumLabel);
        form.appendChild(datumInput);
        form.appendChild(idoLabel);
        form.appendChild(idoInput);

        gombok.appendChild(megseGomb);
        gombok.appendChild(mentesGomb);

        form.appendChild(gombok);
        dialog.appendChild(form);

        document.body.appendChild(dialog);

        form.addEventListener("submit", function(e) {

            e.preventDefault();

            if (!datumInput.value || !idoInput.value) {
                return;
            }

            resolve({
                datum: datumInput.value,
                ido: idoInput.value
            });

            dialog.close();

        });

        megseGomb.addEventListener("click", function() {
            dialog.close();
        });

        dialog.addEventListener("close", function() {
            dialog.remove();
            resolve(null);
        });

        dialog.showModal();

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

        if (feladat === null || feladat.trim() === "") {
            return;
        }

        // DÁTUM ÉS IDŐPONT KIVÁLASZTÁSA
        const valasztas = await datumIdoValasztasa();

        if (!valasztas) {
            return;
        }

        const datumIdo = new Date(
            `${valasztas.datum}T${valasztas.ido}`
        );

        // HATÁRIDŐ ELLENŐRZÉSE
        if (
            isNaN(datumIdo.getTime()) ||
            datumIdo.getFullYear() !== Number(valasztas.datum.slice(0, 4)) ||
            datumIdo.getMonth() + 1 !== Number(valasztas.datum.slice(5, 7)) ||
            datumIdo.getDate() !== Number(valasztas.datum.slice(8, 10))
        ) {

            alert(szovegek[aktualisNyelv].invalidDate);
            return;

        }

        if (datumIdo.getTime() <= Date.now()) {

            alert(szovegek[aktualisNyelv].pastDate);
            return;

        }

        try {

            await addDoc(collection(db, gyujtemeny), {

                text: feladat.trim(),
                completed: false,
                ownerUid: aktualisFelhasznalo.uid,
                ownerName: aktualisFelhasznalo.displayName || "Felhasználó",
                createdAt: serverTimestamp(),
                dueAt: datumIdo.getTime()

            });

        } catch (hiba) {

            console.error("Hozzáadási hiba:", hiba);
            alert(szovegek[aktualisNyelv].addError);

        }

    });

}

// LISTAGOMBOK
teendoHozzaadas("ujTeendoBtn", "privateTasks");
teendoHozzaadas("ujTeendoBtn2", "sharedTasks");


// KÖZÖS LISTA ÚJ FELADATAINAK FIGYELÉSE
function kozosValtozasFigyelese(snapshot) {

    if (kozosElsoBetoltes) {

        kozosElsoBetoltes = false;
        return;

    }

    snapshot.docChanges().forEach(function(valtozas) {

        if (valtozas.type !== "added") {
            return;
        }

        const adat = valtozas.doc.data();

        // Saját hozzáadásról nem küldünk értesítést
        if (
            !aktualisFelhasznalo ||
            adat.ownerUid === aktualisFelhasznalo.uid
        ) {
            return;
        }

        const nev = adat.ownerName || "Egy felhasználó";

        ertesitesKuldes(
            szovegek[aktualisNyelv].sharedNotification,
            nev +
            szovegek[aktualisNyelv].sharedAdded +
            adat.text
        );

    });

}


// HATÁRIDŐK ELLENŐRZÉSE
function hataridokEllenorzese() {

    if (
        !aktualisFelhasznalo ||
        !("Notification" in window) ||
        Notification.permission !== "granted"
    ) {
        return;

    }

    const most = Date.now();

    osszesFeladat.forEach(function(feladat) {

        const adat = feladat.adat;

        if (
            !adat.dueAt ||
            adat.completed
        ) {
            return;
        }

        const hatarido = Number(adat.dueAt);

        const kulcs60 =
            `ertesites_60_${feladat.gyujtemeny}_${feladat.id}`;

        const kulcs15 =
            `ertesites_15_${feladat.gyujtemeny}_${feladat.id}`;

        // 1 ÓRÁS ÉRTESÍTÉS
        if (
            most >= hatarido - 60 * 60 * 1000 &&
            most < hatarido &&
            !localStorage.getItem(kulcs60)
        ) {

            ertesitesKuldes(
                "Easy-Feladatkezelo",
                szovegek[aktualisNyelv].reminder60 + adat.text
            );

            localStorage.setItem(kulcs60, "true");

        }

        // 15 PERCES ÉRTESÍTÉS
        if (
            most >= hatarido - 15 * 60 * 1000 &&
            most < hatarido &&
            !localStorage.getItem(kulcs15)
        ) {

            ertesitesKuldes(
                "Easy-Feladatkezelo",
                szovegek[aktualisNyelv].reminder15 + adat.text
            );

            localStorage.setItem(kulcs15, "true");

        }

    });

}


// HATÁRIDŐK ELLENŐRZÉSE 15 MÁSODPERCENKÉNT
setInterval(hataridokEllenorzese, 15000);


// BEJELENTKEZÉSI ÁLLAPOT FIGYELÉSE
onAuthStateChanged(auth, function(user) {

    aktualisFelhasznalo = user;

    // RÉGI FIGYELŐK LEÁLLÍTÁSA
    if (sajatFigyelo) {
        sajatFigyelo();
        sajatFigyelo = null;
    }

    if (kozosFigyelo) {
        kozosFigyelo();
        kozosFigyelo = null;
    }

    osszesFeladat = [];
    kozosElsoBetoltes = true;

    // LISTÁK TÖRLÉSE
    document.getElementById("teendoLista").innerHTML = "";
    document.getElementById("teendoLista2").innerHTML = "";

    if (user) {

        felhasznaloNev.textContent =
            szovegek[aktualisNyelv].loggedIn + user.displayName;

        // SAJÁT FELADATOK
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

                osszesFeladat = osszesFeladat.filter(
                    f => f.gyujtemeny !== "privateTasks"
                );

                snapshot.docs.forEach(function(dokumentum) {

                    osszesFeladat.push({
                        id: dokumentum.id,
                        adat: dokumentum.data(),
                        gyujtemeny: "privateTasks"
                    });

                });

            },

            function(hiba) {
                console.error("Saját feladatok hibája:", hiba);
            }
        );


        // KÖZÖS FELADATOK
        kozosFigyelo = onSnapshot(
            collection(db, "sharedTasks"),

            function(snapshot) {

                listaMegjelenitese(
                    "teendoLista2",
                    snapshot.docs,
                    "sharedTasks"
                );

                kozosValtozasFigyelese(snapshot);

                osszesFeladat = osszesFeladat.filter(
                    f => f.gyujtemeny !== "sharedTasks"
                );

                snapshot.docs.forEach(function(dokumentum) {

                    osszesFeladat.push({
                        id: dokumentum.id,
                        adat: dokumentum.data(),
                        gyujtemeny: "sharedTasks"
                    });

                });

            },

            function(hiba) {
                console.error("Közös feladatok hibája:", hiba);
            }
        );

    } else {

        felhasznaloNev.textContent = "";

    }

});


