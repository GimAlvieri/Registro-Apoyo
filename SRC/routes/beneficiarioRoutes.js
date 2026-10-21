const express = require("express");
const controller = require("../controllers/beneficiarioController");

const router = express.Router();

router.get("/", controller.list);
router.get("/nuevo", controller.newForm);
router.post("/", controller.create);
router.get("/:id/editar", controller.editForm);
router.post("/:id/editar", controller.update);
router.post("/:id/eliminar", controller.remove);
router.get("/:id", controller.details);

module.exports = router;