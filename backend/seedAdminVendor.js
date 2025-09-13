const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("./models/User");
require("dotenv").config();

async function main() {
  await mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log("✅ Connected to MongoDB");

  const users = [
    {
      name: "Admin User",
      email: "admin@example.com",
      password: "Admin1234", // password
      role: "admin",
      isVendorApproved: true,
    },
    {
      name: "Computer Repair",
      email: "comp.repair@example.com",
      password: "CompRepair123", // password
      role: "vendor",
      isVendorApproved: true,
    },
    {
      name: "Tech Fix",
      email: "tech.fix@example.com",
      password: "TechFix123", // password
      role: "vendor",
      isVendorApproved: true,
    },
    {
      name: "Gadget Rescue",
      email: "gadget.rescue@example.com",
      password: "GadgetRescue123", // password
      role: "vendor",
      isVendorApproved: true,
    },
  ];

  for (let u of users) {
    const exists = await User.findOne({ email: u.email });
    if (exists) {
      console.log(`⚠️ User already exists: ${u.email}`);
      continue;
    }

    const password_hash = await bcrypt.hash(u.password, 10);
    await User.create({
      name: u.name,
      email: u.email,
      password_hash,
      role: u.role,
      isVendorApproved: u.isVendorApproved,
    });
    console.log(`✅ Created user: ${u.email} with password "${u.password}"`);
  }

  mongoose.connection.close();
  console.log("✅ Seeding complete");
}

main().catch((err) => console.error(err));
