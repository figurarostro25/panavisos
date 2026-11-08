# PanAvisos Real MVP

Proyecto base para publicar PanAvisos con datos reales.

## Cuentas necesarias

1. GitHub
   - Crea un repositorio llamado `panavisos`.
   - Puede ser privado.

2. Supabase
   - Crea un proyecto nuevo.
   - Ve a SQL Editor y ejecuta `supabase/schema.sql`.
   - En Project Settings > API copia:
     - Project URL
     - service_role key

3. Cloudinary
   - Crea una cuenta.
   - En Dashboard copia:
     - Cloud name
     - API key
     - API secret

4. Vercel
   - Crea cuenta y conecta el repositorio de GitHub.
   - Agrega las variables de entorno.

## Variables de entorno

Copia `.env.example` como `.env.local` para desarrollo local.
En Vercel agrega las mismas variables en Project Settings > Environment Variables.

```env
NEXT_PUBLIC_SITE_URL=https://tu-dominio.vercel.app
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLOUDINARY_UPLOAD_FOLDER=panavisos/listings
PANAVISOS_ADMIN_PASSWORD=
PANAVISOS_SESSION_SECRET=
```

`PANAVISOS_SESSION_SECRET` debe ser una frase larga aleatoria. No la compartas publicamente.

## Límite de mensajes en Supabase

Antes de desplegar cambios que usen el límite de mensajes, ejecuta una vez
`supabase/upgrade-message-rate-limits.sql` en el SQL Editor de Supabase. La función
solo se puede llamar desde el servidor con `SUPABASE_SERVICE_ROLE_KEY`; la tabla
no es accesible desde clientes públicos ni autenticados.

## Desarrollo local

```bash
npm install
npm run dev
```

Luego abre `http://localhost:3000`.

## Admin

La ruta del panel es `/admin`.
La clave es el valor de `PANAVISOS_ADMIN_PASSWORD`.

## Que incluye

- Catalogo publico.
- Filtros por busqueda, categoria, provincia y precio.
- Detalle de anuncio con WhatsApp/email y mapa simple.
- Panel admin protegido.
- Categorias reales en Supabase.
- Anuncios reales en Supabase.
- Subida firmada a Cloudinary.
- Limpieza de imagenes de Cloudinary al reemplazar o eliminar anuncios.

## Que queda para despues

- Registro publico de vendedores.
- Pagos.
- Anuncios destacados pagados.
- Chat interno.
- Favoritos.
- Estadisticas avanzadas.
- Mapa avanzado.
- App movil/PWA.
