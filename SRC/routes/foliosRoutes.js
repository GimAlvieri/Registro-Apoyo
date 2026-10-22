const express = require("express");
const controller = require("../controllers/foliosController");

const router = express.Router();

router.get("/supabase-config.js", controller.supabaseConfig);
router.get("/", controller.index);

module.exports = router;
