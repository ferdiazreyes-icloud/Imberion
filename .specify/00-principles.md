# Fase Preliminar — Principios y Framework de Arquitectura

## USG Pricing Decision Engine (MVP)

---

## 1. Principios de Arquitectura

### Principios de Negocio
| # | Principio | Descripción | Implicación |
|---|-----------|-------------|-------------|
| BN-01 | Decision-first | La herramienta lleva a decisiones, no solo muestra dashboards | Cada vista termina en recomendación accionable |
| BN-02 | B2B-native | Refleja negocio sell-in hacia distribuidores, no lógica B2C | Modelos de elasticidad consideran rebates, segmentos y territorios |
| BN-03 | Actionability over complexity | Priorizar lo accionable sobre lo sofisticado | MVP con datos mock pero flujo completo |

### Principios de Datos
| # | Principio | Descripción | Implicación |
|---|-----------|-------------|-------------|
| DA-01 | Multi-level drill-down | Toda vista se abre por canal, territorio, segmento, distribuidor, SKU | Modelo de datos jerárquico desde el inicio |
| DA-02 | Backward + Forward | Lectura histórica + escenarios predictivos | Dos capas analíticas: descriptiva y predictiva |
| DA-03 | Confianza explícita | Cada predicción muestra nivel de confianza | Métricas de robustez estadística integradas |

### Principios Tecnológicos
| # | Principio | Descripción | Implicación |
|---|-----------|-------------|-------------|
| TE-01 | Modularidad | Elasticidades es el punto de entrada, no el límite | Arquitectura extensible por módulos |
| TE-02 | Configuración progresiva | Opera con datasets parciales, extensible | Flags de cobertura por entidad |
| TE-03 | Separación de concerns | Frontend, API y motor analítico desacoplados | Tres capas independientes |

---

## 2. Stack Tecnológico Seleccionado

| Capa | Tecnología | Justificación |
|------|-----------|---------------|
| **Frontend** | React + Next.js | SSR, ecosistema maduro, librerías de charts (Recharts/Tremor) |
| **Backend / API** | Python + FastAPI | Ecosistema científico (pandas, scipy, sklearn), async, OpenAPI auto |
| **Motor Analítico** | Python (scipy, statsmodels, sklearn) | Cálculo de elasticidades, simulaciones, modelos predictivos |
| **Base de Datos** | PostgreSQL | Relacional, robusto, soporte JSON, ideal para datos transaccionales + analíticos |
| **Deploy Frontend** | Vercel | Deploy rápido, CDN global, integración nativa con Next.js |
| **Deploy Backend** | Railway / Render | PaaS económico, soporte Python + PostgreSQL, ideal para MVP |
| **Control de versiones** | GitHub | Repositorio actual (Imberion) |

---

## 3. Stakeholders del MVP

| Rol | Perfil | Nivel de acceso |
|-----|--------|-----------------|
| Product Economics / Pricing | Usuario principal, analista | Full access |
| Dirección Comercial | Consumidor de insights | Dashboards + exports |
| Liderazgo de Canal | Decisor sobre distribuidores | Módulos 1, 3, 4 |
| Finanzas / Revenue Management | Validador de impacto | Overview + Recomendaciones |
| Equipos Regionales | Ejecución por territorio | Filtros territoriales |

---

## 4. Restricciones y Supuestos

### Restricciones
- MVP con datos mock (12-24 meses simulados)
- Sin integración transaccional en tiempo real
- Sin workflow de aprobación de precios
- Sin multi-tenant externo

### Supuestos
- USG proporcionará estructura real de categorías y SKUs para validación
- Los datos mock representan patrones verosímiles del negocio
- El MVP se evalúa como prototipo funcional, no como sistema productivo
- El equipo de USG tiene acceso a navegador web moderno
