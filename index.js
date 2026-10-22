require("dotenv").config();

const express = require("express");
const path = require("node:path");
const foliosRoutes = require("./SRC/routes/foliosRoutes");

const app = express();
const publicDirectory = path.join(__dirname, "SRC", "public");

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "SRC", "views"));
app.use(express.static(publicDirectory));
app.use("/", foliosRoutes);

app.use((req, res) => {
  res.status(404).send("Página no encontrada.");
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).send("No se pudo mostrar la aplicación.");
});

const port = Number(process.env.PORT) || 3000;
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}/`);
});
