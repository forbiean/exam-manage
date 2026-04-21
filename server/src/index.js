require("dotenv").config();
const app = require("./app");
const { loadEnv } = require("./config/env");

const env = loadEnv();

app.listen(env.PORT, () => {
  console.log(`Auth server listening on http://localhost:${env.PORT}`);
});

