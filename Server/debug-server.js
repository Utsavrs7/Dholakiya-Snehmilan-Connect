require("dotenv").config();
console.log("Environment loaded.");

try {
    console.log("Loading database config...");
    const connectDB = require("./src/config/db.js");
    console.log("Database config loaded.");

    console.log("Loading app...");
    const app = require("./app");
    console.log("App loaded.");

    console.log("Connecting to database...");
    connectDB()
        .then(() => {
            console.log("Database connected.");
            const http = require("http");
            const server = http.createServer(app);

            server.on('error', (e) => {
                console.error("Server error:", e);
            });

            const PORT = process.env.PORT || 5000;
            console.log(`Attempting to listen on port ${PORT}...`);

            server.listen(PORT, () => {
                console.log(`Server running on port ${PORT}`);
            });
        })
        .catch(err => {
            console.error("Database connection failed:", err);
        });

} catch (error) {
    console.error("Crash during initialization:", error);
}
