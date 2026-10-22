const supabaseConfig = require("../config/supabase");

exports.index = (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  res.render("folios/index");
};

exports.supabaseConfig = (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  res.type("application/javascript").send(
    `window.SUPABASE_CONFIG = ${JSON.stringify(supabaseConfig).replace(/</g, "\\u003c")};`,
  );
};
