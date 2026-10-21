CREATE DATABASE IF NOT EXISTS municipalidad_chinchao
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE municipalidad_chinchao;

CREATE TABLE IF NOT EXISTS empleado (
  id_empleado INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(100) NOT NULL,
  cargo VARCHAR(100) NULL,
  PRIMARY KEY (id_empleado)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS responsable (
  id_responsable INT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_empleado INT UNSIGNED NOT NULL,
  PRIMARY KEY (id_responsable),
  CONSTRAINT fk_responsable_empleado
    FOREIGN KEY (id_empleado) REFERENCES empleado (id_empleado)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS beneficiario (
  id_beneficiario INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(100) NOT NULL,
  dni VARCHAR(15) NOT NULL,
  celular VARCHAR(15) NULL,
  id_responsable INT UNSIGNED NULL,
  PRIMARY KEY (id_beneficiario),
  UNIQUE KEY uq_beneficiario_dni (dni),
  KEY idx_beneficiario_responsable (id_responsable),
  CONSTRAINT fk_beneficiario_responsable
    FOREIGN KEY (id_responsable) REFERENCES responsable (id_responsable)
    ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS solicitud_apoyo (
  id_solicitud INT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_beneficiario INT UNSIGNED NOT NULL,
  monto_apoyo DECIMAL(10, 2) NULL,
  fecha_entrega DATE NOT NULL,
  PRIMARY KEY (id_solicitud),
  KEY idx_solicitud_beneficiario (id_beneficiario),
  KEY idx_solicitud_fecha (fecha_entrega),
  CONSTRAINT fk_solicitud_beneficiario
    FOREIGN KEY (id_beneficiario) REFERENCES beneficiario (id_beneficiario)
) ENGINE=InnoDB;

CREATE OR REPLACE VIEW vista_apoyos_beneficiarios AS
SELECT
  s.id_solicitud,
  b.nombre AS beneficiario,
  b.dni,
  b.celular,
  e.nombre AS responsable,
  e.cargo,
  s.monto_apoyo,
  s.fecha_entrega
FROM solicitud_apoyo AS s
JOIN beneficiario AS b ON b.id_beneficiario = s.id_beneficiario
LEFT JOIN responsable AS r ON r.id_responsable = b.id_responsable
LEFT JOIN empleado AS e ON e.id_empleado = r.id_empleado;
