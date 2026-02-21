require("dotenv").config();
const connectDB = require("../src/config/db");
const School = require("../src/models/School");

// One-time seed script: create initial schools
const run = async () => {
  try {
    await connectDB();

    const schools = [
      { name: "C.K.J. School", category: "Grade-Based", result_pattern: "grade" },
      { name: "S.K.J. School", category: "Grade-Based", result_pattern: "grade" },
      { name: "Nursery School", category: "Grade-Based", result_pattern: "grade" },
      { name: "Standard High School", category: "Percentage-Based", result_pattern: "percentage" },
      { name: "Mixed School", category: "Mixed", result_pattern: "mixed" },
    ];

    for (const schoolData of schools) {
      const exists = await School.findOne({ name: schoolData.name });
      if (!exists) {
        await School.create(schoolData);
        console.log(`Created school: ${schoolData.name}`);
      } else {
        console.log(`School already exists: ${schoolData.name}`);
      }
    }

    console.log("School seeding completed.");
    process.exit(0);
  } catch (err) {
    console.error("Seed failed:", err.message);
    process.exit(1);
  }
};

// Execute the seed script
run();
