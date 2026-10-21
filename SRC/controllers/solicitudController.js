const pool = require("../config/db");

function validateSolicitud(body) {
  const idBeneficiario = Number(body.id_beneficiario);
  const fechaEntrega = String(body.fecha_entrega || "").trim();
  const montoRaw = String(body.monto_apoyo || "").trim();
  const errors = [];
  let montoApoyo = null;

  if (!Number.isInteger(idBeneficiario) || idBeneficiario < 1) {
    errors.push("Selecciona un beneficiario válido.");
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaEntrega)) {
    errors.push("La fecha de entrega es obligatoria y debe ser válida.");
  } else {
    const parsedDate = new Date(`${fechaEntrega}T00:00:00.000Z`);
    if (
      Number.isNaN(parsedDate.getTime()) ||
      parsedDate.toISOString().slice(0, 10) !== fechaEntrega
    ) {
      errors.push("La fecha de entrega no existe en el calendario.");
    }
  }
  if (montoRaw) {
    montoApoyo = Number(montoRaw);
    if (!Number.isFinite(montoApoyo) || montoApoyo < 0) {
      errors.push("El monto debe ser un número igual o mayor que cero.");
    }
  }

  return {
    values: {
      id_beneficiario: Number.isInteger(idBeneficiario) ? idBeneficiario : "",
      fecha_entrega: fechaEntrega,
      monto_apoyo: montoRaw,
    },
    errors,
    idBeneficiario,
    fechaEntrega,
    montoApoyo,
  };
}

async function getBeneficiarios() {
  const [beneficiarios] = await pool.query(
    "SELECT id_beneficiario, nombre, dni FROM beneficiario ORDER BY nombre",
  );
  return beneficiarios;
}

async function renderForm(res, { values, errors = [], status = 200, id = null }) {
  const beneficiarios = await getBeneficiarios();
  res.status(status).render("beneficiario/solicita", {
    solicitud: values,
    beneficiarios,
    errors,
    editing: id !== null,
    id,
  });
}

exports.list = async (req, res) => {
  const [solicitudes] = await pool.query(
    `SELECT id_solicitud, beneficiario, dni, celular, responsable, cargo,
            monto_apoyo, fecha_entrega
     FROM vista_apoyos_beneficiarios
     ORDER BY fecha_entrega DESC, id_solicitud DESC`,
  );
  res.render("solicitud/dashboard", { solicitudes });
};

exports.newForm = async (req, res) => {
  await renderForm(res, {
    values: { id_beneficiario: req.query.id_beneficiario || "", monto_apoyo: "" },
  });
};

exports.create = async (req, res, next) => {
  const validated = validateSolicitud(req.body);
  if (validated.errors.length) {
    await renderForm(res, {
      values: validated.values,
      errors: validated.errors,
      status: 400,
    });
    return;
  }

  try {
    await pool.execute(
      `INSERT INTO solicitud_apoyo (id_beneficiario, monto_apoyo, fecha_entrega)
       VALUES (?, ?, ?)`,
      [
        validated.idBeneficiario,
        validated.montoApoyo,
        validated.fechaEntrega,
      ],
    );
    res.redirect("/solicitudes");
  } catch (error) {
    if (error.code === "ER_NO_REFERENCED_ROW_2") {
      await renderForm(res, {
        values: validated.values,
        errors: ["El beneficiario seleccionado ya no existe."],
        status: 400,
      });
      return;
    }
    next(error);
  }
};

exports.editForm = async (req, res) => {
  const [rows] = await pool.execute(
    `SELECT id_beneficiario, monto_apoyo,
            DATE_FORMAT(fecha_entrega, '%Y-%m-%d') AS fecha_entrega
     FROM solicitud_apoyo WHERE id_solicitud = ?`,
    [req.params.id],
  );
  if (!rows.length) {
    res.status(404).render("error", { message: "No se encontró la solicitud." });
    return;
  }
  await renderForm(res, { values: rows[0], id: req.params.id });
};

exports.update = async (req, res, next) => {
  const validated = validateSolicitud(req.body);
  if (validated.errors.length) {
    await renderForm(res, {
      values: validated.values,
      errors: validated.errors,
      status: 400,
      id: req.params.id,
    });
    return;
  }

  try {
    const [result] = await pool.execute(
      `UPDATE solicitud_apoyo
       SET id_beneficiario = ?, monto_apoyo = ?, fecha_entrega = ?
       WHERE id_solicitud = ?`,
      [
        validated.idBeneficiario,
        validated.montoApoyo,
        validated.fechaEntrega,
        req.params.id,
      ],
    );
    if (!result.affectedRows) {
      const [existing] = await pool.execute(
        "SELECT 1 FROM solicitud_apoyo WHERE id_solicitud = ?",
        [req.params.id],
      );
      if (!existing.length) {
        res.status(404).render("error", { message: "No se encontró la solicitud." });
        return;
      }
    }
    res.redirect("/solicitudes");
  } catch (error) {
    if (error.code === "ER_NO_REFERENCED_ROW_2") {
      await renderForm(res, {
        values: validated.values,
        errors: ["El beneficiario seleccionado ya no existe."],
        status: 400,
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
      "DELETE FROM solicitud_apoyo WHERE id_solicitud = ?",
      [req.params.id],
    );
    if (!result.affectedRows) {
      res.status(404).render("error", { message: "No se encontró la solicitud." });
      return;
    }
    res.redirect("/solicitudes");
  } catch (error) {
    next(error);
  }
};