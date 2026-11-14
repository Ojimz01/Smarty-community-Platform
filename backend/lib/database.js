const mongoose = require("mongoose");
const { seedServiceCategories } = require("./seed");

const LOCAL_URI = "mongodb://127.0.0.1:27017/smart-community";

let connectionPromise = null;
let categoriesSeeded = false;

function missingConfig() {
  const missing = [];
  if (!process.env.MONGODB_URI) missing.push("MONGODB_URI");
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) missing.push("JWT_SECRET");
  return missing;
}

// Reuses one connection across serverless invocations on the same instance.
// On a cold start the first request pays the connection cost and every later
// request reuses the ready connection.
function connectDatabase(uri = process.env.MONGODB_URI || LOCAL_URI) {
  if (mongoose.connection.readyState === 1) {
    if (categoriesSeeded) return Promise.resolve(mongoose.connection);
    return seedServiceCategories().then(() => {
      categoriesSeeded = true;
      return mongoose.connection;
    });
  }

  if (!connectionPromise) {
    connectionPromise = mongoose
      .connect(uri, { serverSelectionTimeoutMS: 10000 })
      .then(async () => {
        await seedServiceCategories();
        categoriesSeeded = true;
        return mongoose.connection;
      })
      .catch((error) => {
        connectionPromise = null;
        categoriesSeeded = false;
        throw error;
      });
  }

  return connectionPromise;
}

module.exports = { connectDatabase, missingConfig };
