const test = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const FavoriteProvider = require("../models/FavoriteProvider");

test("favorite links require a customer and provider and enforce one saved link per pair", async () => {
    const customer = new mongoose.Types.ObjectId();
    const provider = new mongoose.Types.ObjectId();
    const favorite = new FavoriteProvider({ customer, provider });

    await assert.doesNotReject(favorite.validate());
    favorite.customer = undefined;
    await assert.rejects(favorite.validate(), (error) => Boolean(error.errors.customer));

    const uniquePairIndex = FavoriteProvider.schema.indexes().find(([fields, options]) =>
        fields.customer === 1 && fields.provider === 1 && options.unique === true
    );
    assert.ok(uniquePairIndex);
});
