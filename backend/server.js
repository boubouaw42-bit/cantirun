const path = require("path");

require("dotenv").config({
    path: path.join(__dirname, ".env")
});

const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const RAWG_API_KEY = process.env.RAWG_API_KEY;

if (!RAWG_API_KEY) {
    console.error("❌ RAWG_API_KEY manquante dans le fichier .env");
    process.exit(1);
}

app.get("/api", (req, res) => {
    res.json({
        name: "CanIRun API",
        version: "3.0.0",
        status: "online",
        source: "RAWG"
    });
});

app.get("/api/games", async (req, res) => {
    try {
        const search = req.query.search || "";
        const page = Number(req.query.page) || 1;
        const pageSize = Number(req.query.page_size) || 20;

        const params = new URLSearchParams({
            key: RAWG_API_KEY,
            page: page.toString(),
            page_size: Math.min(pageSize, 40).toString()
        });

        if (search.trim()) {
            params.set("search", search.trim());
            params.set("search_precise", "false");
        }

        const url = `https://api.rawg.io/api/games?${params.toString()}`;

        const response = await fetch(url);

        if (!response.ok) {
            const errorText = await response.text();

            console.error("RAWG ERROR:", response.status, errorText);

            return res.status(response.status).json({
                error: "Erreur RAWG",
                status: response.status
            });
        }

        const data = await response.json();

        const games = data.results.map(game => ({
            id: game.id,
            name: game.name,
            slug: game.slug,
            description: game.short_description || "",
            cover: game.background_image || null,
            releaseDate: game.released || null,
            rating: game.rating || 0,
            ratingsCount: game.ratings_count || 0,

            genres: game.genres
                ? game.genres.map(genre => genre.name)
                : [],

            platforms: game.platforms
                ? game.platforms.map(platform => ({
                    name: platform.platform?.name || "Unknown",
                    requirements: platform.requirements || null
                }))
                : [],

            stores: game.stores
                ? game.stores.map(store => ({
                    name: store.store?.name || "Unknown",
                    url: store.url || null
                }))
                : []
        }));

        res.json({
            count: data.count,
            next: data.next,
            previous: data.previous,
            results: games
        });

    } catch (error) {
        console.error("Erreur serveur:", error);

        res.status(500).json({
            error: "Erreur interne du serveur",
            message: error.message
        });
    }
});

app.get("/api/games/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const url =
            `https://api.rawg.io/api/games/${encodeURIComponent(id)}?key=${RAWG_API_KEY}`;

        const response = await fetch(url);

        if (!response.ok) {
            return res.status(response.status).json({
                error: "Jeu introuvable"
            });
        }

        const game = await response.json();

        res.json({
            id: game.id,
            name: game.name,
            slug: game.slug,
            description: game.description_raw || "",
            cover: game.background_image || null,
            releaseDate: game.released || null,
            rating: game.rating || 0,
            ratingsCount: game.ratings_count || 0,

            genres: game.genres
                ? game.genres.map(g => g.name)
                : [],

            developers: game.developers
                ? game.developers.map(d => d.name)
                : [],

            publishers: game.publishers
                ? game.publishers.map(p => p.name)
                : [],

            platforms: game.platforms
                ? game.platforms.map(p => ({
                    name: p.platform?.name || "Unknown",
                    requirements: p.requirements || null
                }))
                : [],

            stores: game.stores
                ? game.stores.map(s => ({
                    name: s.store?.name || "Unknown",
                    url: s.url || null
                }))
                : []
        });

    } catch (error) {
        console.error("Erreur détail:", error);

        res.status(500).json({
            error: "Erreur interne du serveur",
            message: error.message
        });
    }
});

app.listen(PORT, "0.0.0.0", () => {
    console.log("=================================");
    console.log("🎮 CanIRun API");
    console.log("=================================");
    console.log(`🚀 Serveur : http://localhost:${PORT}`);
    console.log("🌐 Source  : RAWG");
    console.log("=================================");
});
