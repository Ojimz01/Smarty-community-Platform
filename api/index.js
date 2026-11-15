const { app } = require("../backend/server");
const { connectDatabase, missingConfig } = require("../backend/lib/database");

// Vercel rewrites every /api/* request to this single function. Express routes
// are defined with the /api prefix, so restore it if the rewrite stripped it.
function normalizeApiUrl(url) {
  if (typeof url !== "string" || url.startsWith("/api")) return url;
  return `/api${url === "/" ? "" : url}`;
}

module.exports = async function handler(req, res) {
  req.url = normalizeApiUrl(req.url);

  const missing = missingConfig();
  if (missing.length) {
    console.error(
      "Smart Community account services are not configured. Missing environment variable(s): " + missing.join(", ")
    );
    res.status(503).json({
      status: "not-configured",
      message: "Online accounts and live listings are temporarily unavailable. Please try again shortly, or explore the interactive demo in the meantime."
    });
    return;
  }

  try {
    await connectDatabase();
  } catch (error) {
    console.error("Smart Community database connection failed:", error.message);
    res.status(503).json({
      status: "database-unavailable",
      message: "Account services are temporarily offline. Please try again shortly."
    });
    return;
  }

  return app(req, res);
};

module.exports.normalizeApiUrl = normalizeApiUrl;
