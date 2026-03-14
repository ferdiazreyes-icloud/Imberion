# Fase E — Oportunidades y Soluciones + Fase F — Plan de Implementación

## USG Pricing Decision Engine (MVP)

---

## Fase E: Oportunidades y Soluciones

### 1. Work Packages (Paquetes de Trabajo)

| WP | Nombre | Dependencias | Complejidad |
|----|--------|-------------|-------------|
| WP-01 | Setup del proyecto (monorepo, Docker, CI) | Ninguna | Baja |
| WP-02 | Modelo de datos + migrations + seeds mock | WP-01 | Media |
| WP-03 | API base (CRUD + filtros) | WP-02 | Media |
| WP-04 | Motor de elasticidades (histórico + predictivo) | WP-02 | Alta |
| WP-05 | Frontend: Layout + Navegación + Filtros globales | WP-01 | Media |
| WP-06 | Módulo Overview (Dashboard KPIs) | WP-03, WP-05 | Media |
| WP-07 | Módulo History (Elasticidades históricas) | WP-04, WP-05 | Media |
| WP-08 | Módulo Simulator (Escenarios) | WP-04, WP-05 | Alta |
| WP-09 | Módulo Recommendations | WP-04, WP-05 | Alta |
| WP-10 | Módulo Passthrough (Rebates) | WP-03, WP-05 | Media |
| WP-11 | Módulo Confianza | WP-04 | Media |
| WP-12 | Exportación (PDF/Excel) | WP-09 | Baja |
| WP-13 | Deploy (Vercel + Railway) | WP-06+ | Baja |
| WP-14 | Testing + QA | Todos | Media |

### 2. Decisiones Clave de Implementación

| Decisión | Opción elegida | Justificación |
|----------|---------------|---------------|
| Monorepo vs Multi-repo | Monorepo | MVP simple, un equipo, despliegue coordinado |
| CSS approach | Tailwind + shadcn/ui | Prototipado rápido, consistencia visual |
| Chart library | Recharts | React-native, declarativo, buen soporte TS |
| Elasticity model | Log-log regression (baseline) | Estándar en price elasticity, interpretable |
| Mock data approach | Script Python generador | Reproducible, configurable, versionado |

---

## Fase F: Plan de Implementación

### Sprint Plan (4 sprints sugeridos)

```
Sprint 1: Fundación                          Sprint 2: Core Analytics
┌─────────────────────────┐                 ┌─────────────────────────┐
│ WP-01: Setup proyecto   │                 │ WP-04: Motor elasticity │
│ WP-02: Modelo de datos  │                 │ WP-06: Overview módulo  │
│ WP-03: API base         │                 │ WP-07: History módulo   │
│ WP-05: Layout + Filtros │                 │ WP-11: Confianza        │
└─────────────────────────┘                 └─────────────────────────┘

Sprint 3: Simulación + Recs                 Sprint 4: Polish + Deploy
┌─────────────────────────┐                 ┌─────────────────────────┐
│ WP-08: Simulator módulo │                 │ WP-12: Export PDF/Excel │
│ WP-09: Recommendations  │                 │ WP-13: Deploy prod      │
│ WP-10: Passthrough      │                 │ WP-14: Testing + QA     │
└─────────────────────────┘                 └─────────────────────────┘
```

### Orden de Implementación Detallado

```
1.  Scaffolding del proyecto (Next.js + FastAPI + Docker)
2.  PostgreSQL schema + Alembic migrations
3.  Script de generación de datos mock (86 SKUs, distribuidores, territorios)
4.  API endpoints base: customers, products, transactions, territories
5.  Frontend: Layout principal, sidebar navegación, filtros globales
6.  Motor de elasticidades (log-log regression por nodo)
7.  Módulo Overview: Dashboard con KPIs dinámicos
8.  Módulo History: Gráficos de elasticidad histórica con drill-down
9.  Motor de confianza estadística (R², p-value, sample size)
10. Módulo Simulator: Creación de escenarios + cálculo de impacto
11. Módulo Recommendations: Recomendaciones por segmento con racional
12. Módulo Passthrough: Vista de rebates y precio neto
13. Exportación de informes (PDF ejecutivo + Excel detallado)
14. Deploy a Vercel (frontend) + Railway (backend + PostgreSQL)
15. Testing end-to-end + ajustes finales
```

### Diagrama de Dependencias

```
WP-01 (Setup)
  │
  ├──► WP-02 (Datos) ──► WP-03 (API) ──► WP-06 (Overview)
  │         │                   │              │
  │         │                   ├──► WP-10 (Passthrough)
  │         │                   │
  │         └──► WP-04 (Elasticity Engine)
  │                    │
  │                    ├──► WP-07 (History)
  │                    ├──► WP-08 (Simulator)
  │                    ├──► WP-09 (Recommendations) ──► WP-12 (Export)
  │                    └──► WP-11 (Confidence)
  │
  └──► WP-05 (Layout/Filtros) ──► WP-06, WP-07, WP-08, WP-09, WP-10
                                          │
                                          └──► WP-13 (Deploy)
                                                  │
                                                  └──► WP-14 (QA)
```

---

## Governance (Fase G - Simplificada para MVP)

### Definition of Done por Work Package
- Código commiteado y pusheado
- API endpoints documentados (OpenAPI auto-generated)
- Componentes frontend funcionales con datos reales del backend
- Filtros de drill-down operativos en cada vista
- Sin errores en consola (frontend) ni en logs (backend)

### Criterios de Aceptación del MVP Completo
1. Las 4 secciones de navegación funcionan end-to-end
2. Filtros globales operan en todas las vistas
3. Simulador calcula escenarios en < 3 segundos
4. Recomendaciones muestran nivel de confianza
5. Se puede exportar informe ejecutivo
6. Deploy accesible desde navegador web
