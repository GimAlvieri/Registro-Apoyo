require("dotenv").config();

const express = require("express");
const path = require("path");

const pool = require("./SRC/config/db");

const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "SRC", "views"));
app.use(express.urlencoded({ extended: false }));

app.use("/beneficiarios", require("./SRC/routes/beneficiarioRoutes"));
app.use("/solicitudes", require("./SRC/routes/solicitudRoutes"));
app.get("/", (req, res) => res.redirect("/beneficiarios"));

app.get("/db-test", async (req, res, next) => {
  try {
    const [rows] = await pool.query("SELECT DATABASE() AS database_name");
    res.json({
      connected: true,
      database: rows[0].database_name,
    });
  } catch (error) {
    next(error);
  }
});

app.use((req, res) => {
  res.status(404).render("error", { message: "Página no encontrada." });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).render("error", {
    message:
      "Ocurrió un error al procesar la solicitud. Revisa la conexión y los datos de la base de datos.",
  });
});

const port = Number(process.env.PORT) || 3001;
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}/`);
});
