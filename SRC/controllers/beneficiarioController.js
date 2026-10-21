const pool = require("../config/db");

const fieldLimits = { nombre: 100, dni: 15, celular: 15 };

function validateBeneficiario(body) {
  const values = {
    nombre: String(body.nombre || "").trim(),
    dni: String(body.dni || "").trim(),
    celular: String(body.celular || "").trim(),
    id_responsable: String(body.id_responsable || "").trim(),
  };
  const errors = [];

  for (const [field, limit] of Object.entries(fieldLimits)) {
    if (field !== "celular" && !values[field]) {
      errors.push(`El campo ${field} es obligatorio.`);
    }
    if (values[field].length > limit) {
      errors.push(`El campo ${field} no puede superar ${limit} caracteres.`);
    }
  }

  if (values.id_responsable) {
    const responsableId = Number(values.id_responsable);
    if (!Number.isInteger(responsableId) || responsableId < 1) {
      errors.push("Selecciona un responsable válido.");
    } else {
      values.id_responsable = responsableId;
    }
  } else {
    values.id_responsable = null;
  }

  values.celular = values.celular || null;
  return { values, errors };
}

async function getResponsables() {
  const [responsables] = await pool.query(
    `SELECT r.id_responsable, e.nombre, e.cargo
     FROM responsable r
     JOIN empleado e ON e.id_empleado = r.id_empleado
     ORDER BY e.nombre`,
  );
  return responsables;
}

async function renderForm(res, { values, errors = [], status = 200, id = null }) {
  const responsables = await getResponsables();
  res.status(status).render("beneficiario/formulario", {
    beneficiario: values,
    responsables,
    errors,
    editing: id !== null,
    id,
  });
}

exports.list = async (req, res) => {
  const [beneficiarios] = await pool.query(
    `SELECT b.id_beneficiario, b.nombre, b.dni, b.celular,
            e.nombre AS responsable, e.cargo,
            COUNT(s.id_solicitud) AS total_apoyos
     FROM beneficiario b
     LEFT JOIN responsable r ON r.id_responsable = b.id_responsable
     LEFT JOIN empleado e ON e.id_empleado = r.id_empleado
     LEFT JOIN solicitud_apoyo s ON s.id_beneficiario = b.id_beneficiario
     GROUP BY b.id_beneficiario, b.nombre, b.dni, b.celular, e.nombre, e.cargo
     ORDER BY b.nombre`,
  );
  res.render("beneficiario/dashboard", { beneficiarios });
};

exports.newForm = async (req, res) => {
  await renderForm(res, { values: {} });
};

exports.create = async (req, res, next) => {
  const { values, errors } = validateBeneficiario(req.body);
  if (errors.length) {
    await renderForm(res, { values, errors, status: 400 });
    return;
  }

  try {
    const [result] = await pool.execute(
      `INSERT INTO beneficiario (nombre, dni, celular, id_responsable)
       VALUES (?, ?, ?, ?)`,
      [values.nombre, values.dni, values.celular, values.id_responsable],
    );
    res.redirect(`/beneficiarios/${result.insertId}`);
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      await renderForm(res, {
        values,
        errors: ["Ya existe un beneficiario registrado con ese DNI."],
        status: 409,
      });
      return;
    }
    next(error);
  }
};

exports.details = async (req, res) => {
  const [rows] = await pool.execute(
    `SELECT b.id_beneficiario, b.nombre, b.dni, b.celular,
            e.nombre AS responsable, e.cargo
     FROM beneficiario b
     LEFT JOIN responsable r ON r.id_responsable = b.id_responsable
     LEFT JOIN empleado e ON e.id_empleado = r.id_empleado
     WHERE b.id_beneficiario = ?`,
    [req.params.id],
  );
  if (!rows.length) {
    res.status(404).render("error", { message: "No se encontró el beneficiario." });
    return;
  }

  const [solicitudes] = await pool.execute(
    `SELECT id_solicitud, monto_apoyo, fecha_entrega
     FROM solicitud_apoyo
     WHERE id_beneficiario = ?
     ORDER BY fecha_entrega DESC`,
    [req.params.id],
  );
  res.render("beneficiario/detalles", {
    beneficiario: rows[0],
    solicitudes,
    error: null,
  });
};

exports.editForm = async (req, res) => {
  const [rows] = await pool.execute(
    `SELECT id_beneficiario, nombre, dni, celular, id_responsable
     FROM beneficiario WHERE id_beneficiario = ?`,
    [req.params.id],
  );
  if (!rows.length) {
    res.status(404).render("error", { message: "No se encontró el beneficiario." });
    return;
  }
  await renderForm(res, { values: rows[0], id: req.params.id });
};

exports.update = async (req, res, next) => {
  const { values, errors } = validateBeneficiario(req.body);
  if (errors.length) {
    await renderForm(res, { values, errors, status: 400, id: req.params.id });
    return;
  }

  try {
    const [result] = await pool.execute(
      `UPDATE beneficiario
       SET nombre = ?, dni = ?, celular = ?, id_responsable = ?
       WHERE id_beneficiario = ?`,
      [
        values.nombre,
        values.dni,
        values.celular,
        values.id_responsable,
        req.params.id,
      ],
    );
    if (!result.affectedRows) {
      const [existing] = await pool.execute(
        "SELECT 1 FROM beneficiario WHERE id_beneficiario = ?",
        [req.params.id],
      );
      if (!existing.length) {
        res.status(404).render("error", { message: "No se encontró el beneficiario." });
        return;
      }
    }
    res.redirect(`/beneficiarios/${req.params.id}`);
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      await renderForm(res, {
        values,
        errors: ["Ya existe un beneficiario registrado con ese DNI."],
        status: 409,
        id: req.params.id,
      });
      return;
    }
    next(error);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const [result] = await pool.execute(
      "DELETE FROM beneficiario WHERE id_beneficiario = ?",
      [req.params.id],
    );
    if (!result.affectedRows) {
      res.status(404).render("error", { message: "No se encontró el beneficiario." });
      return;
    }
    res.redirect("/beneficiarios");
  } catch (error) {
    if (error.code === "ER_ROW_IS_REFERENCED_2") {
      res.status(409).render("error", {
        message: "No se puede eliminar este beneficiario porque tiene solicitudes de apoyo registradas.",
      });
      return;
    }
    next(error);
  }
};