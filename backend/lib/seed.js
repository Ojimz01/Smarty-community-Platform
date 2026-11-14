const ServiceCategory = require("../models/ServiceCategory");

const defaultCategories = [
  { name: "Plumbing", description: "Fix leaks and pipe issues with local professionals." },
  { name: "Electrical", description: "Wiring, repairs, and installations." },
  { name: "Cleaning", description: "Home, office, and deep-cleaning services." },
  { name: "Car repairs", description: "Automotive repair and maintenance." },
  { name: "Painting", description: "Interior and exterior painting services." },
  { name: "Carpentry", description: "Custom woodwork, repairs, and fittings." },
  { name: "Catering", description: "Food preparation and catering for events." },
  { name: "Fashion and tailoring", description: "Garment design, alterations, and tailoring." },
  { name: "Hairdressing", description: "Hair styling and care services." },
  { name: "Computer repairs", description: "Computer diagnostics, repair, and setup." },
  { name: "Landscaping", description: "Garden design, maintenance, and outdoor upgrades." },
  { name: "Other useful services", description: "Other services offered by local professionals." }
];

async function seedServiceCategories() {
  await Promise.all(defaultCategories.map(({ name, description }) =>
    ServiceCategory.updateOne(
      { name },
      { $setOnInsert: { name, description, isActive: true } },
      { upsert: true }
    )
  ));
}

module.exports = { defaultCategories, seedServiceCategories };
