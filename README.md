# Carátulas de Folio

La aplicación utiliza directamente el proyecto de Supabase configurado; no requiere Laragon ni una base de datos MySQL local.

## Preparar Supabase

1. En Supabase, confirma que el proyecto existente contiene las tablas `folios_cv`, `config_visual` y `config_caratula` que usa la guía. No ejecutes un SQL que vuelva a crear o reemplace esas tablas: ya contienen tus datos.
2. En **Project Settings → API**, copia la URL del proyecto y la clave **anon/public**. No uses ni compartas la clave `service_role`.
3. Copia `.env.example` como `.env` en PowerShell:

   ```powershell
   Copy-Item .env.example .env
   ```

4. Completa `SUPABASE_URL` y `SUPABASE_ANON_KEY` en `.env`.

## Iniciar la aplicación

En la carpeta del proyecto, ejecuta:

```powershell
npm.cmd install
npm.cmd start
```

Abre `http://localhost:3000`. La aplicación está ordenada con rutas en `SRC/routes/foliosRoutes.js`, controlador de la vista en `SRC/controllers/foliosController.js`, configuración de Supabase en `SRC/config/supabase.js`, plantilla en `SRC/views/folios/index.ejs` y recursos del navegador en `SRC/public/css/folios.css` y `SRC/public/js/folios.js`.

El controlador valida y entrega la configuración pública a la vista EJS. El inicio de sesión, registro, recuperación y CRUD de folios usan Supabase Auth y el cliente JavaScript del navegador con la clave anon/public; configura y conserva las políticas RLS de Supabase para proteger las tablas. La edición de carátulas, impresión y exportación continúan en el JavaScript de la interfaz.
