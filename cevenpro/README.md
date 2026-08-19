# Cevenpro

Aplicacion independiente para propiedades, inversion y servicios inmobiliarios en Panama.

## Incluido

- Portada comercial y catalogo filtrable.
- Fichas individuales de propiedades.
- Paginas de servicios, inversion, tour y contacto.
- Formularios de prospectos.
- Panel de propietario, administrador, vendedor y editor.
- Archivo historico en lugar de eliminacion permanente.
- Preparacion para Supabase, Cloudinary, Resend, Vercel y un conector privado con PanAvisos.

## Desarrollo local

```powershell
cd "C:\Users\KG Group\Documents\Codex\panavisos\cevenpro"
npm.cmd run dev -- --port 3020
```

Abre `http://localhost:3020`.

## Configuracion posterior

Copia `.env.example` como `.env.local` y agrega las cuentas independientes de Cevenpro. Las claves privadas nunca deben enviarse al navegador ni guardarse en el repositorio.

### Solicitudes y tour inmobiliario

1. Ejecuta `supabase/create-leads.sql` en el proyecto Supabase de Cevenpro.
2. Configura `NEXT_PUBLIC_SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` en Vercel.
3. Verifica el dominio de Cevenpro en Resend y configura `RESEND_API_KEY`, `NOTIFICATION_FROM_EMAIL` y `CEVENPRO_OWNER_EMAIL`.
4. Configura `NEXT_PUBLIC_CEVENPRO_WHATSAPP` con el número internacional, solo dígitos. El chat se habilita de 8:00 a.m. a 6:00 p.m. en Panamá.

### Accesos internos

Configura claves distintas en Vercel:

- `CEVENPRO_ADMIN_PASSWORD`: acceso del propietario a `/admin`.
- `CEVENPRO_TEAM_PASSWORD`: acceso limitado del equipo a `/equipo`.

Los enlaces aparecen discretamente en el pie del sitio, pero ambos paneles requieren autenticación. Los módulos administrativos actuales son una interfaz preparada; las operaciones reales se activan al conectar Supabase.
