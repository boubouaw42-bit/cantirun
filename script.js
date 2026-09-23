const API_URL = "/api";

let currentGames = [];
let currentGame = null;

let searchTimeout = null;


// =====================================================
// PC DETECTION
// =====================================================

function detectOS() {

    const ua = navigator.userAgent;

    if (ua.includes("Windows")) return "Windows";
    if (ua.includes("Linux")) return "Linux";
    if (ua.includes("Mac")) return "macOS";

    return "Inconnu";
}


function detectGPU() {

    try {

        const canvas =
            document.createElement("canvas");

        const gl =
            canvas.getContext("webgl") ||
            canvas.getContext("experimental-webgl");

        if (!gl) {
            return "GPU inconnu";
        }

        const debugInfo =
            gl.getExtension(
                "WEBGL_debug_renderer_info"
            );

        if (debugInfo) {

            return gl.getParameter(
                debugInfo.UNMASKED_RENDERER_WEBGL
            );
        }

        return gl.getParameter(
            gl.RENDERER
        );

    } catch (error) {

        console.error(
            "Erreur GPU :",
            error
        );

        return "GPU inconnu";
    }
}


function getCurrentRAM() {

    return navigator.deviceMemory || 8;
}


function detectPC() {

    document.getElementById(
        "pcOS"
    ).textContent =
        detectOS();


    document.getElementById(
        "pcCPU"
    ).textContent =
        `${navigator.hardwareConcurrency || 4} threads`;


    document.getElementById(
        "pcGPU"
    ).textContent =
        detectGPU();


    document.getElementById(
        "pcRAM"
    ).textContent =
        navigator.deviceMemory
            ? `${navigator.deviceMemory} GB`
            : "8 GB estimés";
}


// =====================================================
// GPU
// =====================================================

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


function getGPUSScore(gpuName) {

    const gpu =
        String(gpuName)
            .toLowerCase();


    for (
        const [name, score]
        of Object.entries(GPU_SCORES)
    ) {

        if (
            gpu.includes(name)
        ) {

            return score;
        }
    }


    if (
        gpu.includes("intel") &&
        gpu.includes("graphics")
    ) {

        return 100;
    }


    return 150;
}


// =====================================================
// GAME CATEGORIES
// =====================================================

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

    "candy crush",
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
    "minecraft",
    "roblox",
    "don't starve",
    "hollow knight",
    "cuphead",
    "dead cells"
];


// =====================================================
// COMPATIBILITY
// =====================================================

function getStatus(game) {

    const gpu =
        detectGPU().toLowerCase();

    const score =
        getGPUSScore(gpu);

    const ram =
        getCurrentRAM();

    const name =
        String(game.name || "")
            .toLowerCase();


    if (
        VERY_HEAVY_GAMES.some(
            x => name.includes(x)
        )
    ) {

        if (
            score >= 900 &&
            ram >= 16
        ) {

            return {
                className: "green",
                label: "🟢 Compatible"
            };
        }


        if (
            score >= 300 &&
            ram >= 8
        ) {

            return {
                className: "yellow",
                label: "🟡 Possible"
            };
        }


        return {
            className: "red",
            label: "🔴 Très difficile"
        };
    }


    if (
        LIGHT_GAMES.some(
            x => name.includes(x)
        )
    ) {

        return {
            className: "green",
            label: "🟢 Compatible"
        };
    }


    if (
        MEDIUM_GAMES.some(
            x => name.includes(x)
        )
    ) {

        if (
            score >= 500 &&
            ram >= 8
        ) {

            return {
                className: "green",
                label: "🟢 Compatible"
            };
        }


        if (
            score >= 100 &&
            ram >= 8
        ) {

            return {
                className: "yellow",
                label: "🟡 Possible"
            };
        }


        return {
            className: "red",
            label: "🔴 Difficile"
        };
    }


    return {
        className: "yellow",
        label: "🟡 À vérifier"
    };
}


// =====================================================
// FPS
// =====================================================

function estimateFPS(game) {

    const score =
        getGPUSScore(
            detectGPU()
        );


    const name =
        String(game.name || "")
            .toLowerCase();


    if (
        LIGHT_GAMES.some(
            x => name.includes(x)
        )
    ) {

        return 60;
    }


    if (
        name.includes("elden ring")
    ) {

        if (score >= 900) return 60;
        if (score >= 500) return 40;
        if (score >= 300) return 25;

        return 15;
    }


    if (
        name.includes("cyberpunk 2077")
    ) {

        if (score >= 900) return 60;
        if (score >= 500) return 35;
        if (score >= 300) return 25;

        return 10;
    }


    if (
        name.includes("grand theft auto v")
    ) {

        if (score >= 900) return 80;
        if (score >= 500) return 60;
        if (score >= 300) return 45;

        return 30;
    }


    if (
        name.includes("grand theft auto iv")
    ) {

        if (score >= 500) return 60;
        if (score >= 300) return 50;

        return 35;
    }


    if (
        name.includes("black ops ii")
    ) {

        return 60;
    }


    if (
        name.includes("black ops iii")
    ) {

        if (score >= 500) return 55;
        if (score >= 300) return 40;

        return 25;
    }


    if (
        name.includes("arkham city")
    ) {

        if (score >= 500) return 80;
        if (score >= 300) return 60;

        return 40;
    }


    if (
        name.includes("arkham knight")
    ) {

        if (score >= 900) return 60;
        if (score >= 500) return 40;
        if (score >= 300) return 25;

        return 15;
    }


    if (score <= 120) return 30;

    if (score <= 200) return 40;

    if (score <= 400) return 55;

    if (score <= 700) return 70;

    return 90;
}


// =====================================================
// SEARCH SUGGESTIONS
// =====================================================

function setupSearchSuggestions() {

    const input =
        document.getElementById(
            "searchInput"
        );


    input.addEventListener(
        "input",
        () => {

            const query =
                input.value.trim();


            clearTimeout(
                searchTimeout
            );


            if (
                query.length < 2
            ) {

                hideSuggestions();

                return;
            }


            showSuggestionLoading();


            searchTimeout =
                setTimeout(
                    () => {

                        fetchSuggestions(
                            query
                        );

                    },
                    350
                );

        }
    );


    document.addEventListener(
        "click",
        event => {

            const container =
                document.getElementById(
                    "searchSuggestions"
                );


            if (
                !container.contains(event.target) &&
                !input.contains(event.target)
            ) {

                hideSuggestions();
            }

        }
    );
}


async function fetchSuggestions(
    query
) {

    try {

        const response =
            await fetch(
                `${API_URL}/games?search=${encodeURIComponent(query)}&page_size=6`
            );


        if (!response.ok) {
            throw new Error(
                "Erreur API"
            );
        }


        const data =
            await response.json();


        displaySuggestions(
            data.results || []
        );


    } catch (error) {

        console.error(
            "Suggestions :",
            error
        );

        hideSuggestions();
    }
}


function showSuggestionLoading() {

    const container =
        document.getElementById(
            "searchSuggestions"
        );


    container.classList.remove(
        "hidden"
    );


    container.innerHTML = `
        <div class="suggestion-loading">
            🔎 Recherche...
        </div>
    `;
}


function displaySuggestions(
    games
) {

    const container =
        document.getElementById(
            "searchSuggestions"
        );


    if (!games.length) {

        container.innerHTML = `
            <div class="suggestion-loading">
                Aucun jeu trouvé.
            </div>
        `;

        container.classList.remove(
            "hidden"
        );

        return;
    }


    container.innerHTML = "";


    games.forEach(
        game => {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "suggestion";


            const cover =
                game.cover ||
                "";


            const year =
                game.releaseDate
                    ? new Date(
                        game.releaseDate
                    ).getFullYear()
                    : "—";


            const rating =
                game.rating
                    ? `⭐ ${game.rating.toFixed(1)}`
                    : "⭐ —";


            item.innerHTML = `

                <img
                    class="suggestion-cover"
                    src="${cover}"
                    alt=""
                >

                <div class="suggestion-info">

                    <div class="suggestion-name">
                        ${escapeHTML(game.name)}
                    </div>

                    <div class="suggestion-meta">

                        <span>
                            ${year}
                        </span>

                        <span class="suggestion-rating">
                            ${rating}
                        </span>

                    </div>

                </div>
            `;


            item.addEventListener(
                "click",
                () => {

                    hideSuggestions();

                    document.getElementById(
                        "searchInput"
                    ).value =
                        game.name;


                    displayGame(
                        game
                    );

                }
            );


            container.appendChild(
                item
            );

        }
    );


    container.classList.remove(
        "hidden"
    );
}


function hideSuggestions() {

    const container =
        document.getElementById(
            "searchSuggestions"
        );


    container.classList.add(
        "hidden"
    );
}


// =====================================================
// SEARCH BUTTON
// =====================================================

async function searchGame() {

    const input =
        document.getElementById(
            "searchInput"
        );


    const status =
        document.getElementById(
            "searchStatus"
        );


    const query =
        input.value.trim();


    if (!query) {

        status.textContent =
            "Entre le nom d'un jeu.";

        return;
    }


    hideSuggestions();


    status.textContent =
        "🔎 Recherche dans RAWG...";


    try {

        const response =
            await fetch(
                `${API_URL}/games?search=${encodeURIComponent(query)}&page_size=20`
            );


        if (!response.ok) {
            throw new Error(
                `Erreur API ${response.status}`
            );
        }


        const data =
            await response.json();


        currentGames =
            data.results || [];


        displaySearchResults(
            currentGames
        );


        status.textContent =
            `✅ ${Number(
                data.count || 0
            ).toLocaleString(
                "fr-FR"
            )} résultat(s)`;


        document
            .getElementById(
                "catalogue"
            )
            .scrollIntoView({
                behavior: "smooth"
            });


    } catch (error) {

        console.error(
            error
        );


        status.textContent =
            "❌ Impossible de contacter CanIRun.";
    }
}


// =====================================================
// RESULTS
// =====================================================

function displaySearchResults(
    games
) {

    const container =
        document.getElementById(
            "gameResults"
        );


    const count =
        document.getElementById(
            "resultCount"
        );


    count.textContent =
        `${games.length} affiché(s)`;


    if (!games.length) {

        container.innerHTML = `
            <div class="empty-state">
                😕 Aucun jeu trouvé.
            </div>
        `;

        return;
    }


    container.innerHTML = "";


    games.forEach(
        game => {

            container.appendChild(
                createGameCard(game)
            );

        }
    );
}


// =====================================================
// GAME CARD
// =====================================================

function createGameCard(
    game
) {

    const card =
        document.createElement(
            "article"
        );


    card.className =
        "game-card";


    const status =
        getStatus(game);


    const genres =
        (game.genres || [])
            .slice(0, 3)
            .map(
                genre =>
                    `<span class="genre">${escapeHTML(genre)}</span>`
            )
            .join("");


    card.innerHTML = `

        <img
            class="game-card-cover"
            src="${game.cover || ""}"
            alt="${escapeHTML(game.name)}"
            loading="lazy"
        >

        <div class="game-card-body">

            <div class="game-card-title">
                ${escapeHTML(game.name)}
            </div>

            <div class="game-card-date">
                ${
                    game.releaseDate
                        ? formatDate(
                            game.releaseDate
                        )
                        : "Date inconnue"
                }
            </div>

            <div class="game-card-genres">
                ${genres}
            </div>

            <div class="game-status ${status.className}">
                ${status.label}
            </div>

        </div>
    `;


    card.addEventListener(
        "click",
        () => displayGame(game)
    );


    return card;
}


// =====================================================
// GAME DETAIL
// =====================================================

async function displayGame(
    game
) {

    currentGame =
        game;


    const section =
        document.getElementById(
            "result"
        );


    section.classList.remove(
        "hidden"
    );


    section.scrollIntoView({
        behavior: "smooth"
    });


    document.getElementById(
        "gameName"
    ).textContent =
        game.name;


    document.getElementById(
        "gameMeta"
    ).textContent =
        game.releaseDate
            ? `Sortie : ${formatDate(
                game.releaseDate
            )}`
            : "Date inconnue";


    document.getElementById(
        "gameCover"
    ).src =
        game.cover || "";


    document.getElementById(
        "gameDescription"
    ).textContent =
        game.description ||
        "Aucune description disponible.";


    const status =
        getStatus(game);


    const badge =
        document.getElementById(
            "compatibilityBadge"
        );


    badge.className =
        `compatibility-badge ${status.className}`;


    badge.textContent =
        status.label;


    const fps =
        estimateFPS(game);


    document.getElementById(
        "fpsValue"
    ).textContent =
        `${fps} FPS`;


    document.getElementById(
        "fpsBar"
    ).style.width =
        `${Math.min(
            (fps / 60) * 100,
            100
        )}%`;


    document.getElementById(
        "settingsValue"
    ).textContent =
        fps >= 60
            ? "Élevé"
            : fps >= 40
                ? "Moyen"
                : fps >= 25
                    ? "Faible"
                    : "Très faible";


    document.getElementById(
        "releaseDate"
    ).textContent =
        game.releaseDate
            ? formatDate(game.releaseDate)
            : "Inconnue";


    document.getElementById(
        "platformRequirement"
    ).textContent =
        (game.platforms || [])
            .map(
                p => p.name
            )
            .filter(Boolean)
            .join(", ") ||
        "Inconnues";


    try {

        const response =
            await fetch(
                `${API_URL}/games/${game.id}`
            );


        if (!response.ok) {
            return;
        }


        const detailedGame =
            await response.json();


        if (
            detailedGame.description
        ) {

            document.getElementById(
                "gameDescription"
            ).textContent =
                detailedGame.description;
        }


        updateRequirements(
            detailedGame
        );


        setupStoreLink(
            detailedGame
        );


    } catch (error) {

        console.error(
            "Erreur détails :",
            error
        );
    }
}


// =====================================================
// REQUIREMENTS
// =====================================================

function updateRequirements(
    game
) {

    const pc =
        (game.platforms || [])
            .find(
                p =>
                    p.name === "PC"
            );


    if (
        !pc ||
        !pc.requirements
    ) {

        document.getElementById(
            "ramRequirement"
        ).textContent =
            "Non disponible";


        document.getElementById(
            "gpuRequirement"
        ).textContent =
            "Non disponible";


        return;
    }


    const minimum =
        pc.requirements.minimum ||
        "";


    const recommended =
        pc.requirements.recommended ||
        "";


    document.getElementById(
        "ramRequirement"
    ).textContent =
        minimum ||
        recommended ||
        "Non disponible";


    document.getElementById(
        "gpuRequirement"
    ).textContent =
        recommended ||
        minimum ||
        "Non disponible";
}


// =====================================================
// STORE
// =====================================================

function setupStoreLink(
    game
) {

    const link =
        document.getElementById(
            "gameStoreLink"
        );


    const steam =
        (game.stores || [])
            .find(
                store =>
                    String(
                        store.name
                    )
                        .toLowerCase()
                        .includes("steam")
            );


    if (
        steam &&
        steam.url
    ) {

        link.href =
            steam.url;

        link.textContent =
            "Voir sur Steam";

    } else {

        link.href =
            `https://rawg.io/games/${game.slug}`;

        link.textContent =
            "Voir la fiche RAWG";
    }
}


// =====================================================
// UTILITIES
// =====================================================

function formatDate(
    date
) {

    try {

        return new Date(
            date
        ).toLocaleDateString(
            "fr-FR",
            {
                day: "2-digit",
                month: "2-digit",
                year: "numeric"
            }
        );

    } catch {

        return date;
    }
}


function escapeHTML(
    text
) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        text ?? "";


    return div.innerHTML;
}


// =====================================================
// EVENTS
// =====================================================

document
    .getElementById(
        "searchButton"
    )
    .addEventListener(
        "click",
        searchGame
    );


document
    .getElementById(
        "searchInput"
    )
    .addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Enter"
            ) {

                searchGame();
            }

        }
    );


document
    .getElementById(
        "backToResults"
    )
    .addEventListener(
        "click",
        () => {

            document
                .getElementById(
                    "catalogue"
                )
                .scrollIntoView({
                    behavior: "smooth"
                });

        }
    );


// =====================================================
// START
// =====================================================

detectPC();

setupSearchSuggestions();


console.log(
    "🎮 CanIRun chargé"
);


console.log(
    "GPU :",
    detectGPU()
);


console.log(
    "RAM :",
    getCurrentRAM(),
    "GB"
);
