import admin from "firebase-admin";
import fs from "fs";
import path from "path";

const __dirname = path.resolve();
const serviceAccountPath = path.join(__dirname, "go-deliver-adminsd.json");
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export default admin;
