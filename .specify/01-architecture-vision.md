# Fase A — Visión de Arquitectura

## USG Pricing Decision Engine (MVP)

---

## 1. Problema de Negocio

USG necesita tomar decisiones de pricing basadas en datos para su canal de distribuidores nacionales en México. Actualmente:
- Las decisiones de precio se toman sin visibilidad completa de elasticidades
- No existe simulación de escenarios de cambio de precio
- El análisis de rebates y passthrough es manual o inexistente
- No hay segmentación analítica de distribuidores para diferenciación de precios

---

## 2. Visión de Solución

> Un motor de decisión de precios B2B que transforma datos de sell-in en recomendaciones accionables de pricing por segmento de distribuidor, territorio y SKU.

### Diagrama de Visión (Alto Nivel)

```
┌─────────────────────────────────────────────────────────────────┐
│                        USUARIO FINAL                            │
│         (Pricing / Commercial Excellence / Dirección)           │
└─────────────────┬───────────────────────┬───────────────────────┘
                  │                       │
                  ▼                       ▼
┌────────────────────────────────┐  ┌─────────────────────────┐
│      FRONTEND (Next.js)        │  │   AGENTE AI (Chat)       │
│                                │  │                          │
│  ┌─────────┐ ┌─────────┐      │  │  Panel lateral (w-96)    │
│  │Overview  │ │ History │      │  │  + Página dedicada       │
│  │Dashboard │ │Elasticit│      │  │                          │
│  └─────────┘ └─────────┘      │  │  "¿Por qué bajó el      │
│  ┌─────────┐ ┌───────────┐   │  │   margen en el Norte?"   │
│  │Simulator│ │Recommend. │    │  │                          │
│  │Scenarios│ │by Segment │    │  │  Contexto: ve la misma   │
│  └─────────┘ └───────────┘   │  │  página y filtros que    │
│  ┌─────────┐                  │  │  el usuario              │
│  │Passthru │                  │  │                          │
│  │& Rebates│                  │  └──────────┬───────────────┘
│  └─────────┘                  │             │
└────────────────┬──────────────┘             │
                 │ REST API (JSON)            │ SSE Streaming
                 ▼                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND (FastAPI)                              │
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌────────────────────────┐  │
│  │  API Layer   │  │  Analytics   │  │   Recommendation       │  │
│  │  (Routes +   │  │  Engine      │  │   Engine               │  │
│  │   Filters)   │  │  (Elasticity │  │   (Pricing rules +     │  │
│  │              │  │   Models)    │  │    confidence scores)  │  │
│  └──────┬──────┘  └─────────────┘  └────────────────────────┘  │
│         │                                                        │
│  ┌──────┴──────────────────────────────────────────────────┐    │
│  │              AI AGENT SERVICE (LangGraph)                 │    │
│  │                                                          │    │
│  │  Orchestrator ──► Tool Executor ──► Deep Analyst         │    │
│  │  (Sonnet 4)       (Sonnet 4)       (Opus 4)             │    │
│  │       │               │                │                 │    │
│  │       │          7 Tools (reuse        │                 │    │
│  │       │          existing queries)     │                 │    │
│  │       └──────────────────────────► Synthesizer           │    │
│  │                                    (Sonnet 4)            │    │
│  └──────────────────────────────────────────────────────────┘    │
└──────────────────────────┬──────────────────────────────────────┘
                           │ SQL / ORM
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    POSTGRESQL                                    │
│                                                                  │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────────┐  │
│  │ Customers  │ │ Products  │ │Transactions│ │  Scenarios    │  │
│  │ & Segments │ │ & SKUs    │ │  Sell-in   │ │  & Results    │  │
│  └───────────┘ └───────────┘ └───────────┘ └───────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Capacidades Objetivo del MVP

| ID | Capacidad | Módulo | Prioridad |
|----|-----------|--------|-----------|
| C-01 | Visualizar KPIs del portafolio | Overview | Must |
| C-02 | Analizar elasticidades históricas | History | Must |
| C-03 | Drill-down por canal/territorio/segmento/distribuidor/SKU | Todos | Must |
| C-04 | Simular escenarios de cambio de precio | Simulator | Must |
| C-05 | Generar recomendaciones por segmento | Recommendations | Must |
| C-06 | Distinguir precio lista vs neto (rebates) | Passthrough | Must |
| C-07 | Mostrar nivel de confianza de predicciones | Confidence | Must |
| C-08 | Exportar informes ejecutivos | Recommendations | Should |
| C-09 | Visualizar sell-out cuando exista | Sell-out | Could |
| C-10 | Estimar impacto competitivo | Competitors | Could |
| C-11 | Consulta conversacional de datos (Agente AI) | Agent | Must |

---

## 4. Flujo Principal del Usuario (Journey)

```
                    ┌───────────────┐
                    │   LOGIN       │
                    │  (simplified) │
                    └──────┬────────┘
                           │
                           ▼
                    ┌───────────────┐
                    │   OVERVIEW    │  ← "¿Cómo está mi portafolio?"
                    │   Dashboard   │
                    └──────┬────────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
    ┌─────────────┐ ┌──────────┐ ┌──────────────┐
    │  HISTORY    │ │SIMULATOR │ │RECOMMENDATIONS│
    │ "¿Qué pasó?"│ │"¿Qué si?"│ │"¿Qué hago?"  │
    └──────┬──────┘ └────┬─────┘ └──────┬───────┘
           │             │              │
           ▼             ▼              ▼
    ┌─────────────────────────────────────────┐
    │         EXPORT / INFORME EJECUTIVO       │
    │     "Recomendaciones con sustento"        │
    └─────────────────────────────────────────┘
```

---

## 5. Alcance vs Exclusiones (Línea Roja)

### Dentro del MVP
- 4 secciones de navegación principales + módulos de soporte
- Datos mock verosímiles (86 SKUs, 10 categorías, 20-30 distribuidores)
- Elasticidades históricas y predictivas
- Simulador de escenarios
- Recomendaciones por segmento
- Nivel de confianza explícito
- Exportación básica

### Fuera del MVP (Roadmap futuro)
- Motor de optimización de rebates
- Integración transaccional en tiempo real
- Workflow de aprobación
- Multi-tenant
- Optimización multiobjetivo

---

## 6. Riesgos Arquitectónicos

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| Datos mock no representativos | Baja credibilidad en demo | Validar estructura con USG antes de generar |
| Elasticidades sin robustez estadística | Recomendaciones erróneas | Módulo de confianza + flags de calidad |
| Over-engineering del MVP | Retraso en entrega | Principio de actionability over complexity |
| Desacople front-back dificulta iteración | Lentitud en cambios | API contract-first con OpenAPI |

---

## 7. Criterios de Éxito de la Arquitectura

1. El usuario puede navegar de Overview → History → Simulator → Recommendations en < 5 clics
2. Cada vista soporta filtros por canal, territorio, segmento, distribuidor, SKU
3. El simulador recalcula escenarios en < 3 segundos
4. Las recomendaciones incluyen nivel de confianza visible
5. El sistema puede operar con datos parciales sin errores
6. La arquitectura permite agregar sell-out y competidores sin rediseño
