// ============================================================
// CanIRun - Backend
// ============================================================

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({
    path: path.join(__dirname, ".env")
});

const app = express();

const PORT = process.env.PORT || 3000;
const RAWG_API_KEY = process.env.RAWG_API_KEY;


// ============================================================
// MIDDLEWARE
// ============================================================

app.use(cors());
app.use(express.json());


// ============================================================
// FRONTEND
// ============================================================

app.use(
    express.static(
        path.join(__dirname, "..")
    )
);

app.get("/", (req, res) => {

    res.sendFile(
        path.join(
            __dirname,
            "..",
            "index.html"
        )
    );
});


// ============================================================
// HELPERS
// ============================================================

function normalizeText(text) {

    return String(text || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
}


function calculateSearchScore(game, query) {

    const name =
        normalizeText(game.name);

    const search =
        normalizeText(query);

    if (!name || !search) {
        return 0;
    }

    let score = 0;

    const words =
        search
            .split(/\s+/)
            .filter(Boolean);


    // Correspondance exacte
    if (name === search) {
        score += 10000;
    }


    // Le nom commence exactement par la recherche
    if (name.startsWith(search)) {
        score += 5000;
    }


    // Le premier mot correspond
    if (
        name
            .split(/\s+/)[0]
            ?.startsWith(words[0])
    ) {
        score += 3000;
    }


    // Chaque mot recherché présent dans le nom
    for (const word of words) {

        if (name.includes(word)) {
            score += 1000;
        }
    }


    // Recherche par acronymes / cas fréquents
    const aliases = {

        "fc": [
            "ea sports fc"
        ],

        "cod": [
            "call of duty"
        ],

        "gta": [
            "grand theft auto"
        ],

        "mc": [
            "minecraft"
        ],

        "mw": [
            "modern warfare"
        ],

        "bo": [
            "black ops"
        ],

        "rdr": [
            "red dead redemption"
        ],

        "spider": [
            "spider-man"
        ],

        "ark": [
            "arkham"
        ]
    };


    if (aliases[search]) {

        for (const alias of aliases[search]) {

            if (name.includes(alias)) {
                score += 6000;
            }
        }
    }


    // Popularité RAWG
    const popularity =
        Number(game.added || 0);

    score += Math.min(
        popularity / 10,
        1500
    );


    // Note RAWG
    const rating =
        Number(game.rating || 0);

    score += rating * 100;


    // Nombre de votes
    const ratingsCount =
        Number(game.ratings_count || 0);

    score += Math.min(
        ratingsCount / 100,
        500
    );


    // Les jeux récents sont légèrement favorisés
    if (game.released) {

        const year =
            new Date(game.released).getFullYear();

        if (!Number.isNaN(year)) {

            const currentYear =
                new Date().getFullYear();

            const age =
                currentYear - year;

            if (age <= 1) {
                score += 250;
            } else if (age <= 3) {
                score += 150;
            }
        }
    }


    return score;
}


function sortGames(games, query) {

    return [...games].sort(
        (a, b) =>
            calculateSearchScore(b, query) -
            calculateSearchScore(a, query)
    );
}


// ============================================================
// FORMAT RAWG GAME
// ============================================================

function formatGame(game) {

    return {

        id: game.id,

        name: game.name,

        cover:
            game.background_image ||
            game.image ||
            null,

        releaseDate:
            game.released ||
            null,

        rating:
            game.rating ||
            0,

        ratingsCount:
            game.ratings_count ||
            0,

        popularity:
            game.added ||
            0,

        genres:
            Array.isArray(game.genres)
                ? game.genres.map(
                    genre => genre.name
                )
                : []
    };
}


// ============================================================
// API
// ============================================================

app.get("/api", (req, res) => {

    res.json({
        name: "CanIRun API",
        status: "online"
    });
});


// ============================================================
// SEARCH GAMES
// ============================================================

app.get("/api/games", async (req, res) => {

    try {

        if (!RAWG_API_KEY) {

            return res.status(500).json({
                error: "RAWG_API_KEY manquante."
            });
        }


        const query =
            String(req.query.search || "")
                .trim();


        const pageSize =
            Math.min(
                Math.max(
                    Number(req.query.page_size) || 20,
                    1
                ),
                40
            );


        const page =
            Math.max(
                Number(req.query.page) || 1,
                1
            );


        const params =
            new URLSearchParams({

                key: RAWG_API_KEY,

                page: String(page),

                page_size: String(
                    Math.max(
                        pageSize,
                        20
                    )
                )
            });


        if (query) {

            params.set(
                "search",
                query
            );

            params.set(
                "search_precise",
                "false"
            );

            params.set(
                "search_exact",
                "false"
            );
        }


        const url =
            `https://api.rawg.io/api/games?${params.toString()}`;


        const response =
            await fetch(url);


        if (!response.ok) {

            const text =
                await response.text();

            console.error(
                "RAWG error:",
                response.status,
                text
            );

            return res.status(
                response.status
            ).json({

                error:
                    "Erreur lors de la recherche RAWG."
            });
        }


        const data =
            await response.json();


        let games =
            Array.isArray(data.results)
                ? data.results
                : [];


        // Recherche intelligente
        if (query) {

            games =
                sortGames(
                    games,
                    query
                );
        }


        games =
            games
                .slice(0, pageSize)
                .map(formatGame);


        res.json({

            count:
                data.count || games.length,

            next:
                data.next || null,

            previous:
                data.previous || null,

            results:
                games
        });

    } catch (error) {

        console.error(
            "Games API error:",
            error
        );

        res.status(500).json({

            error:
                "Impossible de récupérer les jeux."
        });
    }
});


// ============================================================
// GAME DETAILS
// ============================================================

app.get("/api/games/:id", async (req, res) => {

    try {

        if (!RAWG_API_KEY) {

            return res.status(500).json({
                error: "RAWG_API_KEY manquante."
            });
        }


        const id =
            encodeURIComponent(
                req.params.id
            );


        const url =
            `https://api.rawg.io/api/games/${id}?key=${encodeURIComponent(
                RAWG_API_KEY
            )}`;


        const response =
            await fetch(url);


        if (!response.ok) {

            return res.status(
                response.status
            ).json({

                error:
                    "Jeu introuvable."
            });
        }


        const game =
            await response.json();


        res.json({

            id:
                game.id,

            name:
                game.name,

            cover:
                game.background_image ||
                null,

            releaseDate:
                game.released ||
                null,

            rating:
                game.rating ||
                0,

            ratingsCount:
                game.ratings_count ||
                0,

            genres:
                Array.isArray(game.genres)
                    ? game.genres.map(
                        genre =>
                            genre.name
                    )
                    : [],

            description:
                game.description_raw ||
                game.description ||
                "Aucune description disponible.",

            platforms:
                Array.isArray(game.platforms)
                    ? game.platforms.map(
                        platform =>
                            platform.platform?.name
                    ).filter(Boolean)
                    : []
        });

    } catch (error) {

        console.error(
            "Game details error:",
            error
        );

        res.status(500).json({

            error:
                "Impossible de charger le jeu."
        });
    }
});


// ============================================================
// START SERVER
// ============================================================

app.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log(
            `CanIRun lancé sur le port ${PORT}`
        );
    }
);
