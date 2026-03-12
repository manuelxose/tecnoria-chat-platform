# Rework Audit And Delivery

## Resumen ejecutivo

Se ha ejecutado un rework integral de la capa pública de Talkaris sobre `apps/portal` con cuatro objetivos principales:

1. reposicionar la marca como plataforma de IA conversacional premium y operable
2. convertir la home en una pieza flagship orientada a demo y autoridad
3. ampliar la densidad semántica y la intención SEO real de cada página indexable
4. dejar un sistema visual y de contenidos escalable para futuras iteraciones editoriales

Supuesto director del rework:

- buyer principal: equipos B2B de producto/SaaS con necesidad de captación, soporte y gobierno conversacional
- conversión principal: solicitud de demo consultiva
- prueba pública disponible: producto, arquitectura y credibilidad operacional, sin inventar clientes o métricas

## Auditoría inicial

### Problemas detectados

- La web pública estaba resuelta casi por completo con una única plantilla genérica y un contenido plano en `public-site.ts`.
- La home tenía propuesta de valor insuficiente, mezcla idiomática visible en producción y muy poca narrativa comercial.
- El diseño visual transmitía estado preliminar: paleta correcta pero genérica, tipografía sin carga real, poca jerarquía y sin assets editoriales potentes.
- Las páginas indexables competían con intenciones muy parecidas y con demasiada poca profundidad semántica.
- El blog existía técnicamente pero sin experiencia editorial sólida ni estrategia visible cuando no había posts.
- El CTA principal “solicitar acceso” comunicaba gating interno, no venta consultiva.
- El formulario de captación estaba bien a nivel técnico mínimo, pero mal framed comercialmente.
- La señalética SEO era funcional pero demasiado genérica: titles, descriptions y keywords poco diferenciados por página.
- No había breadcrumbs semánticos ni una arquitectura clara para escalar contenido.
- La biblioteca de imágenes era prácticamente inexistente: solo iconos y una social card básica.

### Qué se ha mantenido

- Angular SSR, routing bilingüe, `robots.txt`, `sitemap.xml`, canonical, `hreflang` y base JSON-LD
- estructura pública principal por rutas indexables existentes
- contrato de integración con el widget y API pública
- flujo backend del formulario vía `POST /v1/public/access-requests`

## Decisiones estratégicas

- Mantener las rutas SEO actuales para no romper continuidad orgánica, pero rehacer por completo la narrativa y el diseño.
- Reposicionar la conversión principal hacia demo consultiva, con alias/redirect desde los slugs antiguos de acceso.
- Separar mejor marca pública y operación interna: la capa comercial vende valor; el portal sigue existiendo como acceso privado.
- Construir un shell de marketing reusable con header responsive, footer real y navegación consistente.
- Elevar la capa editorial del blog aunque todavía no haya posts publicados, para que el sitio no “colapse” visual ni estratégicamente en vacío.
- Añadir assets propios y piezas generadas con SiliconFlow solo donde el resultado superaba el listón visual.

## Cambios realizados por página

### Home `/` y `/en`

- Hero completamente rehecho con nueva propuesta de valor, badges, CTA principal a demo y visual editorial de mayor impacto.
- Nueva narrativa por bloques: valor, plataforma, diferenciación, proceso y FAQ.
- Mejora fuerte en claridad comercial y orientación al negocio.
- Mayor densidad semántica sobre plataforma conversacional, widget embebible, conocimiento gobernado y operación multi-tenant.

### Plataforma `/funcionalidades` y `/en/features`

- Reescritura total del enfoque hacia capacidades reales y utilidad operativa.
- Secciones específicas para widget, conocimiento y operación.
- Copy más técnico-comercial y mejor alineado con intención de búsqueda.

### Integraciones `/integraciones` y `/en/integrations`

- Se reorganizó por contexto real de despliegue: web corporativa, SaaS y portales/soporte.
- Se eliminaron formulaciones genéricas y se conectó mejor con los casos de uso posteriores.

### Casos de uso `/casos-de-uso` y `/en/use-cases`

- Nueva narrativa orientada a preventa, soporte, onboarding y documentación.
- Clarificación del encaje del producto según momento del usuario y tipo de flujo.

### FAQ `/faq` y `/en/faq`

- FAQ completamente rehecha para responder dudas reales de implantación y no solo “rellenar” SEO.
- Mejor aprovechamiento de FAQPage schema y de la intención informacional.

### Blog `/blog` y `/en/blog`

- La página ya no parece vacía ni provisional cuando no existen artículos.
- Se introducen líneas editoriales y framing SEO/editorial claros.
- Los cards de artículo tienen mejor jerarquía, fallback visual y mejor conexión con la conversión principal.

### Artículo de blog

- Nuevo layout editorial con sidebar, CTA y tipografía más cuidada.
- Mejor integración del contenido con la capa comercial del sitio.

### Solicitud de demo

- Reemplazo de “solicitar acceso” por “solicitar demo”.
- Nuevo framing comercial, proceso posterior explicado y formulario más convincente.
- Rutas nuevas: `/solicitar-demo` y `/en/request-demo`, con redirect desde las antiguas.

## Cambios visuales

- Nuevo sistema de color con base marfil + azul profundo + verde mineral + acento dorado.
- Nueva jerarquía tipográfica con `Outfit` para display y `Manrope` para texto.
- Reescritura completa del CSS global para convertirlo en un sistema visual reusable.
- Header sticky premium con menú responsive real.
- Footer completo con navegación, señales de producto y contacto.
- Cards, badges, CTA, hero y grids rediseñados con mejor acabado y ritmo vertical.
- Nuevos assets editoriales SVG para hero, integraciones y blog.
- Nueva social card SVG alineada con la identidad premium.

## Cambios de copy

- Reescritura profunda de titulares, subtítulos, resúmenes y CTA en toda la capa pública.
- Eliminación de claims vagos y sustitución por capacidades/beneficios concretos.
- Mejor traducción de capacidades técnicas a valor comercial.
- Mejor framing del buyer esperado y del encaje del producto.
- Bilingüismo mantenido con copy completo en español e inglés.

## Cambios SEO

- `seoTitle`, `seoDescription` y `seoKeywords` específicos por página.
- Mayor cobertura semántica por intención:
  - plataforma conversacional
  - widget IA embebible
  - chatbot para SaaS
  - soporte con IA
  - operaciones de conocimiento
  - multi-tenant governance
- Breadcrumb schema para páginas públicas y artículos.
- Mejora del JSON-LD por tipo de página.
- Mejor arquitectura de enlazado interno entre home, plataforma, integraciones, casos de uso, FAQ, blog y demo.
- Sitemap y robots preservados, con nuevas prioridades para blog y continuidad bilingüe.

## Cambios de imágenes

- Nuevos SVG editoriales:
  - `talkaris-hero-scene.svg`
  - `talkaris-integration-scene.svg`
  - `talkaris-blog-scene.svg`
- Nueva social card:
  - `talkaris-social-card.svg`
- Generación SiliconFlow:
  - `talkaris-editorial-campaign.png` se usa en blog y casos de uso
  - `talkaris-hero-campaign.png` se generó pero no se activó por contaminación tipográfica en la imagen

## Mejoras responsive

- Navegación móvil real con toggle.
- Revisión completa de stacking, paddings, tipografía y densidad visual.
- Hero, grids, blog cards, CTA y formularios adaptados a móvil sin depender del desktop.
- Mejoras de foco visible y legibilidad táctil.

## Mejoras de conversión

- CTA principal consistente hacia demo.
- Claridad superior de propuesta de valor y siguientes pasos.
- Página de demo consultiva con mejor framing.
- Blog y FAQ conectados con surfaces comerciales.
- Señales de credibilidad basadas en producto y operación, sin inventar social proof.

## Esquema de keywords objetivo por página

| Página | Keyword principal | Keywords secundarias |
| --- | --- | --- |
| Home ES | plataforma IA conversacional | chatbot IA para empresas, widget embebible, soporte con IA |
| Plataforma ES | funcionalidades chatbot IA | widget IA embebible, analítica conversacional, base de conocimiento |
| Integraciones ES | integración chatbot IA web | chatbot para SaaS, asistente IA para portales |
| Casos de uso ES | casos de uso chatbot IA | preventa con IA, onboarding con IA, documentación conversacional |
| FAQ ES | preguntas frecuentes chatbot IA | integración, multi-tenant, ingestión de contenido |
| Blog ES | blog IA conversacional | chatbot para SaaS, operaciones de conocimiento |
| Home EN | conversational AI platform | embedded AI widget, AI assistant for SaaS |
| Features EN | AI chatbot features | knowledge base, conversation analytics |
| Integrations EN | AI chatbot integration website | SaaS chatbot, support portal assistant |
| Use cases EN | AI chatbot use cases | pre-sales AI assistant, onboarding assistant |
| FAQ EN | chatbot FAQ | integration, governed knowledge, multi-tenant |
| Blog EN | conversational AI blog | SaaS chatbot blog, knowledge operations |

## Riesgos y limitaciones

- El build de Angular sigue muriendo por limitación del entorno (`code 137` en esbuild). Se validó con `npm test` y `npx tsc -p tsconfig.app.json --noEmit`, pero no con build productivo completo.
- No se incorporó CMS; el contenido público sigue versionado en código, aunque ahora con mejor estructura.
- No se añadieron logos, métricas ni testimonios de clientes por ausencia de pruebas reales verificables.
- La primera imagen generada con SiliconFlow para hero se descartó por calidad semántica insuficiente.

## Fase 2 recomendada

- Añadir contenido real al blog y enlazado interno basado en clusters.
- Incorporar casos reales, logos o métricas cuando existan pruebas publicables.
- Implementar analítica de conversión explícita sobre CTA y formulario público.
- Revisar el pipeline de build para eliminar el cuello de botella de memoria en Angular/esbuild.
- Explorar una librería ligera de motion o interacciones de entrada solo si se validan sin coste en rendimiento.
