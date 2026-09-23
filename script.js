// ============================================================
// CanIRun - Frontend
// ============================================================

const API_URL = "/api";


// ============================================================
// GPU SCORES
// ============================================================

const GPU_SCORES = {

    "hd graphics 4000": 55,
    "hd graphics 4400": 65,
    "hd graphics 4600": 75,

    "hd graphics 5000": 80,
    "hd graphics 510": 85,
    "hd graphics 515": 90,
    "hd graphics 615": 100,
    "hd graphics 620": 120,

    "uhd graphics 600": 130,
    "uhd graphics 605": 140,
    "uhd graphics 610": 145,
    "uhd graphics 620": 150,
    "uhd graphics 630": 180,

    "gtx 750": 270,
    "gtx 750 ti": 300,
    "gtx 950": 380,
    "gtx 960": 420,

    "gtx 1050": 500,
    "gtx 1050 ti": 600,
    "gtx 1060": 750,

    "gtx 1650": 900,
    "gtx 1660": 1100,

    "rtx 2060": 1300,
    "rtx 3060": 1800,
    "rtx 4060": 2400
};


// ============================================================
// GAME CATEGORIES
// ============================================================

const VERY_HEAVY_GAMES = [

    "cyberpunk 2077",
    "elden ring",
    "elden ring nightreign",
    "marvel's spider-man remastered",
    "marvel's spider-man 2",
    "the last of us part i",
    "starfield",
    "red dead redemption 2",
    "hogwarts legacy",
    "alan wake 2",
    "black myth: wukong",
    "monster hunter wilds",
    "forza horizon 5"
];


const MEDIUM_GAMES = [

    "grand theft auto v",
    "grand theft auto iv",
    "batman: arkham knight",
    "call of duty: black ops iii",
    "the witcher 3",
    "forza horizon 4",
    "far cry 5",
    "far cry 6",
    "resident evil 2",
    "resident evil 3",
    "resident evil 4"
];


const LIGHT_GAMES = [

    "minecraft",
    "roblox",
    "terraria",
    "stardew valley",
    "among us",
    "undertale",
    "celeste",
    "limbo",
    "portal",
    "portal 2",
    "half-life",
    "half-life 2",
    "team fortress 2",
    "left 4 dead",
    "left 4 dead 2",
    "don't starve",
    "hollow knight",
    "cuphead",
    "dead cells",
    "candy crush"
];


// ============================================================
// DOM
// ============================================================

const searchInput =
    document.getElementById("searchInput");

const searchButton =
    document.getElementById("searchButton");

const searchSuggestions =
    document.getElementById("searchSuggestions");

const searchStatus =
    document.getElementById("searchStatus");

const gameResults =
    document.getElementById("gameResults");

const gameDetailSection =
    document.getElementById("gameDetailSection");

const gameDetail =
    document.getElementById("gameDetail");

const backButton =
    document.getElementById("backButton");


// ============================================================
// UTILITIES
// ============================================================

function escapeHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


function getYear(date) {

    if (!date) {
        return "Date inconnue";
    }

    const year =
        new Date(date).getFullYear();

    return Number.isNaN(year)
        ? "Date inconnue"
        : year;
}


// ============================================================
// GPU
// ============================================================

function getGPUScore(gpuName) {

    if (!gpuName) {
        return 150;
    }

    const gpu =
        gpuName.toLowerCase();


    for (
        const [name, score]
        of Object.entries(GPU_SCORES)
    ) {

        if (gpu.includes(name)) {
            return score;
        }
    }


    if (
        gpu.includes("intel") &&
        gpu.includes("graphics")
    ) {
        return 100;
    }


    if (
        gpu.includes("amd") ||
        gpu.includes("radeon")
    ) {
        return 250;
    }


    if (gpu.includes("nvidia")) {
        return 400;
    }


    return 150;
}


// ============================================================
// GAME DIFFICULTY
// ============================================================

function getGameDifficulty(gameName) {

    const name =
        gameName.toLowerCase();


    if (
        VERY_HEAVY_GAMES.some(
            game =>
                name.includes(game)
        )
    ) {
        return "very-heavy";
    }


    if (
        MEDIUM_GAMES.some(
            game =>
                name.includes(game)
        )
    ) {
        return "medium";
    }


    if (
        LIGHT_GAMES.some(
            game =>
                name.includes(game)
        )
    ) {
        return "light";
    }


    return "medium";
}


// ============================================================
// FPS ESTIMATION
// ============================================================

function calculateFPS(
    gameName,
    gpuName,
    ramGB
) {

    const gpuScore =
        getGPUScore(gpuName);


    const difficulty =
        getGameDifficulty(gameName);


    let baseFPS;


    if (
        difficulty === "light"
    ) {

        baseFPS = 70;

    } else if (
        difficulty === "medium"
    ) {

        baseFPS = 35;

    } else {

        baseFPS = 15;
    }


    let fps =
        baseFPS *
        (gpuScore / 100);


    // RAM
    if (ramGB) {

        if (ramGB < 4) {

            fps *= 0.65;

        } else if (ramGB < 8) {

            fps *= 0.85;
        }
    }


    fps =
        Math.max(
            2,
            Math.min(
                240,
                fps
            )
        );


    fps =
        Math.round(fps);


    let label;
    let className;


    if (fps >= 60) {

        label = "🟢 Très jouable";
        className = "good";

    } else if (fps >= 40) {

        label = "🟢 Jouable";
        className = "good";

    } else if (fps >= 30) {

        label = "🟡 Jouable avec compromis";
        className = "medium";

    } else if (fps >= 20) {

        label = "🟠 Limite";
        className = "medium";

    } else {

        label = "🔴 Très difficile";
        className = "bad";
    }


    return {

        fps,

        label,

        className
    };
}


// ============================================================
// SEARCH SUGGESTIONS
// ============================================================

let searchTimer = null;


function setupSearchSuggestions() {

    if (!searchInput) {
        return;
    }


    searchInput.addEventListener(
        "input",
        () => {

            clearTimeout(
                searchTimer
            );


            const query =
                searchInput.value.trim();


            if (query.length < 1) {

                hideSuggestions();

                return;
            }


            searchTimer =
                setTimeout(
                    () =>
                        loadSuggestions(
                            query
                        ),
                    300
                );
        }
    );


    document.addEventListener(
        "click",
        event => {

            if (
                !searchSuggestions.contains(
                    event.target
                ) &&
                event.target !== searchInput
            ) {

                hideSuggestions();
            }
        }
    );
}


async function loadSuggestions(query) {

    try {

        const response =
            await fetch(
                `${API_URL}/games?search=${encodeURIComponent(
                    query
                )}&page_size=6`
            );


        if (!response.ok) {
            throw new Error(
                "Erreur API"
            );
        }


        const data =
            await response.json();


        const games =
            data.results || [];


        if (!games.length) {

            searchSuggestions.innerHTML = `
                <div class="suggestion">
                    <div class="suggestion-info">
                        Aucun jeu trouvé.
                    </div>
                </div>
            `;

            searchSuggestions
                .classList
                .remove("hidden");

            return;
        }


        searchSuggestions.innerHTML =
            games.map(
                game => `

                <button
                    type="button"
                    class="suggestion"
                    data-game-id="${escapeHTML(
                        game.id
                    )}"
                >

                    <img
                        class="suggestion-cover"
                        src="${escapeHTML(
                            game.cover || ""
                        )}"
                        alt=""
                        loading="lazy"
                    >

                    <div class="suggestion-info">

                        <div class="suggestion-name">
                            ${escapeHTML(
                                game.name
                            )}
                        </div>

                        <div class="suggestion-meta">

                            ${escapeHTML(
                                getYear(
                                    game.releaseDate
                                )
                            )}

                            ${
                                game.rating
                                    ? ` • ★ ${Number(
                                        game.rating
                                    ).toFixed(1)}`
                                    : ""
                            }

                        </div>

                    </div>

                </button>

            `
            ).join("");


        searchSuggestions
            .querySelectorAll(
                ".suggestion[data-game-id]"
            )
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        const id =
                            button.dataset.gameId;


                        const selected =
                            games.find(
                                game =>
                                    String(
                                        game.id
                                    ) ===
                                    String(id)
                            );


                        if (selected) {

                            searchInput.value =
                                selected.name;
                        }


                        hideSuggestions();

                        loadGameDetails(
                            id
                        );
                    }
                );
            });


        searchSuggestions
            .classList
            .remove("hidden");

    } catch (error) {

        console.error(error);

        hideSuggestions();
    }
}


function hideSuggestions() {

    if (!searchSuggestions) {
        return;
    }

    searchSuggestions
        .classList
        .add("hidden");
}


// ============================================================
// SEARCH
// ============================================================

async function searchGames() {

    const query =
        searchInput.value.trim();


    if (!query) {

        searchStatus.textContent =
            "Écris le nom d'un jeu.";

        return;
    }


    hideSuggestions();


    searchStatus.textContent =
        "Recherche intelligente en cours...";


    gameResults.innerHTML =
        `<div class="loading">
            🔍 Recherche...
        </div>`;


    try {

        const response =
            await fetch(
                `${API_URL}/games?search=${encodeURIComponent(
                    query
                )}&page_size=20`
            );


        if (!response.ok) {
            throw new Error(
                "Erreur API"
            );
        }


        const data =
            await response.json();


        const games =
            data.results || [];


        renderGames(games);


        searchStatus.textContent =
            `${data.count || games.length} résultat(s) trouvé(s).`;

    } catch (error) {

        console.error(error);


        searchStatus.textContent =
            "❌ Impossible de contacter CanIRun.";


        gameResults.innerHTML = `
            <div class="empty">
                Une erreur est survenue pendant la recherche.
            </div>
        `;
    }
}


// ============================================================
// RENDER GAME CARDS
// ============================================================

function renderGames(games) {

    if (!games.length) {

        gameResults.innerHTML = `
            <div class="empty">
                Aucun jeu trouvé.
            </div>
        `;

        return;
    }


    gameResults.innerHTML =
        games.map(
            game => `

            <article class="game-card">

                <img
                    class="game-cover"
                    src="${escapeHTML(
                        game.cover || ""
                    )}"
                    alt="${escapeHTML(
                        game.name
                    )}"
                    loading="lazy"
                >


                <div class="game-card-content">

                    <div class="game-card-title">
                        ${escapeHTML(
                            game.name
                        )}
                    </div>


                    <div class="game-card-meta">

                        ${escapeHTML(
                            getYear(
                                game.releaseDate
                            )
                        )}

                        ${
                            game.rating
                                ? ` • ★ ${Number(
                                    game.rating
                                ).toFixed(1)}`
                                : ""
                        }

                    </div>


                    <button
                        class="game-card-button"
                        type="button"
                        data-game-id="${escapeHTML(
                            game.id
                        )}"
                    >
                        Vérifier mon PC
                    </button>

                </div>

            </article>

        `
        ).join("");


    gameResults
        .querySelectorAll(
            "[data-game-id]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    loadGameDetails(
                        button.dataset.gameId
                    );
                }
            );
        });
}


// ============================================================
// GAME DETAILS
// ============================================================

async function loadGameDetails(id) {

    try {

        gameDetailSection
            .classList
            .remove("hidden");


        gameDetail.innerHTML =
            `<div class="loading">
                Chargement du jeu...
            </div>`;


        gameDetailSection.scrollIntoView({
            behavior: "smooth"
        });


        const response =
            await fetch(
                `${API_URL}/games/${encodeURIComponent(
                    id
                )}`
            );


        if (!response.ok) {
            throw new Error(
                "Jeu introuvable"
            );
        }


        const game =
            await response.json();


        const pc =
            getDetectedPC();


        const fpsEstimate =
            calculateFPS(
                game.name,
                pc.gpu,
                pc.ram
            );


        gameDetail.innerHTML = `

            <div class="detail">

                <div>

                    <img
                        class="detail-cover"
                        src="${escapeHTML(
                            game.cover || ""
                        )}"
                        alt="${escapeHTML(
                            game.name
                        )}"
                    >

                </div>


                <div class="detail-content">

                    <h2>
                        ${escapeHTML(
                            game.name
                        )}
                    </h2>


                    <div class="detail-meta">

                        <span class="tag">
                            ${escapeHTML(
                                getYear(
                                    game.releaseDate
                                )
                            )}
                        </span>


                        <span class="tag">
                            ★ ${Number(
                                game.rating || 0
                            ).toFixed(1)}
                        </span>


                        ${
                            game.genres
                                ?.map(
                                    genre =>
                                        `<span class="tag">
                                            ${escapeHTML(
                                                genre
                                            )}
                                        </span>`
                                )
                                .join("")
                            || ""
                        }

                    </div>


                    <p class="detail-description">

                        ${
                            escapeHTML(
                                game.description ||
                                "Aucune description disponible."
                            )
                        }

                    </p>


                    <div class="compatibility">

                        <div class="compatibility-title">
                            Performances estimées
                        </div>


                        <div
                            class="compatibility-result ${fpsEstimate.className}"
                        >
                            ${fpsEstimate.label}
                        </div>


                        <div class="fps-result">

                            <strong>
                                ${fpsEstimate.fps}
                            </strong>

                            <span>
                                FPS estimés
                            </span>

                        </div>


                        <p class="detail-description">

                            Estimation basée sur le
                            GPU, la RAM et la difficulté
                            du jeu.

                            <br>

                            Les performances réelles
                            peuvent varier selon les
                            réglages graphiques.

                        </p>

                    </div>

                </div>

            </div>
        `;

    } catch (error) {

        console.error(error);


        gameDetail.innerHTML = `
            <div class="empty">
                Impossible de charger les informations du jeu.
            </div>
        `;
    }
}


// ============================================================
// PC DETECTION
// ============================================================

let detectedPC = {

    gpu: null,

    ram: null,

    cpu: null,

    browser: null,

    screen: null,

    os: null
};


function detectGPU() {

    try {

        const canvas =
            document.createElement(
                "canvas"
            );


        const gl =
            canvas.getContext("webgl") ||
            canvas.getContext(
                "experimental-webgl"
            );


        if (!gl) {
            return "Non disponible";
        }


        const debugInfo =
            gl.getExtension(
                "WEBGL_debug_renderer_info"
            );


        if (debugInfo) {

            return gl.getParameter(
                debugInfo
                    .UNMASKED_RENDERER_WEBGL
            );
        }


        return gl.getParameter(
            gl.RENDERER
        );

    } catch (error) {

        console.error(
            "GPU detection error:",
            error
        );

        return "Non disponible";
    }
}


function detectBrowser() {

    const userAgent =
        navigator.userAgent;


    if (
        userAgent.includes("Edg/")
    ) {
        return "Microsoft Edge";
    }


    if (
        userAgent.includes("Chrome/")
    ) {
        return "Google Chrome";
    }


    if (
        userAgent.includes("Firefox/")
    ) {
        return "Mozilla Firefox";
    }


    if (
        userAgent.includes("Safari/")
    ) {
        return "Safari";
    }


    return "Navigateur inconnu";
}


function detectOS() {

    const userAgent =
        navigator.userAgent;


    if (
        userAgent.includes("Windows")
    ) {
        return "Windows";
    }


    if (
        userAgent.includes("Android")
    ) {
        return "Android";
    }


    if (
        userAgent.includes("iPhone") ||
        userAgent.includes("iPad")
    ) {
        return "iOS";
    }


    if (
        userAgent.includes("Mac OS")
    ) {
        return "macOS";
    }


    if (
        userAgent.includes("Linux")
    ) {
        return "Linux";
    }


    return "Système inconnu";
}


function detectPC() {

    const gpu =
        detectGPU();


    const ram =
        navigator.deviceMemory
            ? navigator.deviceMemory
            : null;


    const cpu =
        navigator.hardwareConcurrency
            ? navigator.hardwareConcurrency
            : null;


    const browser =
        detectBrowser();


    const screen =
        `${window.screen.width} × ${window.screen.height}`;


    const os =
        detectOS();


    detectedPC = {

        gpu,

        ram,

        cpu,

        browser,

        screen,

        os
    };


    document.getElementById(
        "pcGPU"
    ).textContent =
        gpu;


    document.getElementById(
        "pcRAM"
    ).textContent =
        ram
            ? `${ram} GB environ`
            : "Non disponible";


    document.getElementById(
        "pcCPU"
    ).textContent =
        cpu
            ? `${cpu} cœurs logiques`
            : "Non disponible";


    document.getElementById(
        "pcBrowser"
    ).textContent =
        browser;


    document.getElementById(
        "pcScreen"
    ).textContent =
        screen;


    document.getElementById(
        "pcOS"
    ).textContent =
        os;


    document
        .getElementById("pcInfo")
        .classList
        .remove("hidden");


    document
        .getElementById("pcStatus")
        .textContent =
        "✅ Analyse terminée";
}


function getDetectedPC() {

    if (!detectedPC.gpu) {
        detectPC();
    }


    return detectedPC;
}


// ============================================================
// EVENTS
// ============================================================

if (searchButton) {

    searchButton.addEventListener(
        "click",
        searchGames
    );
}


if (searchInput) {

    searchInput.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Enter"
            ) {

                searchGames();
            }
        }
    );
}


const detectPCButton =
    document.getElementById(
        "detectPCButton"
    );


if (detectPCButton) {

    detectPCButton.addEventListener(
        "click",
        detectPC
    );
}


if (backButton) {

    backButton.addEventListener(
        "click",
        () => {

            gameDetailSection
                .classList
                .add("hidden");


            window.scrollTo({

                top: 0,

                behavior: "smooth"
            });
        }
    );
}


// ============================================================
// INITIAL LOAD
// ============================================================

async function loadPopularGames() {

    try {

        gameResults.innerHTML =
            `<div class="loading">
                🎮 Chargement des jeux...
            </div>`;


        const response =
            await fetch(
                `${API_URL}/games?page_size=20`
            );


        if (!response.ok) {
            throw new Error(
                "Erreur API"
            );
        }


        const data =
            await response.json();


        renderGames(
            data.results || []
        );

    } catch (error) {

        console.error(error);


        gameResults.innerHTML = `
            <div class="empty">
                Impossible de charger les jeux.
            </div>
        `;
    }
}


setupSearchSuggestions();

loadPopularGames();