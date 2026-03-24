# Fase B — Arquitectura de Negocio

## USG Pricing Decision Engine (MVP)

---

## 1. Mapa de Capacidades de Negocio

```
USG Pricing Decision Engine
│
├── Inteligencia de Precios
│   ├── Análisis de Elasticidad Histórica
│   ├── Modelado Predictivo de Elasticidad
│   └── Nivel de Confianza Estadística
│
├── Simulación y Escenarios
│   ├── Creación de Escenarios
│   ├── Comparación vs Base
│   └── Curvas Precio-Volumen-Margen
│
├── Recomendaciones de Pricing
│   ├── Por Segmento de Distribuidor
│   ├── Por Territorio
│   ├── Por Categoría / SKU
│   └── Headroom Analysis
│
├── Gestión de Rebates y Passthrough
│   ├── Precio Lista vs Precio Neto
│   ├── Impacto de Rebates en Volumen
│   └── Identificación de Rebates Ineficientes
│
├── Reporting y Exportación
│   ├── Informe Ejecutivo
│   ├── Export de Escenarios
│   └── Vistas Filtradas
│
├── Consulta Conversacional (Agente AI)
│   ├── Consulta de KPIs y métricas por lenguaje natural
│   ├── Análisis causal y estratégico (multi-modelo)
│   ├── Simulación de escenarios por conversación
│   ├── Contexto de pantalla (ve lo que el usuario ve)
│   └── 7 herramientas (tools) que reutilizan la lógica existente
│
└── [Futuro] Extensiones
    ├── Sell-out Integration
    ├── Competitive Intelligence
    └── Rebate Optimization Engine
```

---

## 2. Procesos de Negocio (As-Is → To-Be)

### Proceso: Decisión de Cambio de Precio

#### As-Is (Sin herramienta)
```
Solicitud de  ──► Análisis manual ──► Reunión de ──► Decisión ──► Comunicación
cambio precio     en Excel/BI         comité          intuición     al canal
                  (días/semanas)       pricing         + experiencia
```

#### To-Be (Con Pricing Decision Engine)
```
Identificar    ──► Revisar         ──► Simular      ──► Validar         ──► Decisión
oportunidad        elasticidades       escenarios       con confianza       con sustento
(Overview)         históricas          (Simulator)      estadística         analítico
                   (History)                            (Confidence)        (Recommendations)
                                                                            │
       ┌────────────────────────────────────────────────────────────────────┤
       │                                                                    ▼
       ▼                                                                Exportar
  AGENTE AI ◄──► Consulta en cualquier punto del flujo                  informe
  "¿Por qué bajó    usando lenguaje natural.                            ejecutivo
   el margen?"       El agente ve la misma pantalla
                     y filtros que el usuario.
```

---

## 3. Modelo de Dominio de Negocio

### Entidades Principales

```
┌──────────────┐        ┌──────────────┐
│   CLIENTE    │        │  PRODUCTO    │
│ (Distribuidor)│        │   (SKU)      │
├──────────────┤        ├──────────────┤
│ Nombre       │        │ Nombre       │
│ Tipo         │        │ Categoría    │
│ Segmento     │◄──┐    │ Subcategoría │
│ (Oro/Plata/  │   │    │ Atributos    │
│  Bronce)     │   │    └──────┬───────┘
│ Región       │   │           │
│ Estado       │   │           │
└──────┬───────┘   │           │
       │           │           │
       ▼           │           │
┌──────────────┐   │           │
│  SUCURSAL    │   │           │
├──────────────┤   │           │
│ Nombre       │   │           │
│ Dirección    │   │           │
│ Municipio    │   │           │
│ Estado       │   │           │
└──────────────┘   │           │
                   │           │
              ┌────┴───────────┴────┐
              │   TRANSACCIÓN       │
              │    SELL-IN          │
              ├─────────────────────┤
              │ Fecha               │
              │ Volumen             │
              │ Precio Lista        │
              │ Descuento           │
              │ Rebate              │
              │ Precio Neto         │
              └─────────┬───────────┘
                        │
                        ▼
              ┌─────────────────────┐
              │   ELASTICIDAD       │
              ├─────────────────────┤
              │ Tipo (hist/predict) │
              │ Coeficiente         │
              │ Nivel Confianza     │
              │ Nodo (segmento,     │
              │   territorio, SKU)  │
              └─────────┬───────────┘
                        │
                        ▼
              ┌─────────────────────┐       ┌─────────────────────┐
              │   ESCENARIO         │──────►│   RECOMENDACIÓN     │
              ├─────────────────────┤       ├─────────────────────┤
              │ Nombre              │       │ Acción sugerida     │
              │ Supuestos           │       │ Impacto estimado    │
              │ Rango cambio precio │       │ Nivel confianza     │
              │ Resultados          │       │ Racional            │
              └─────────────────────┘       └─────────────────────┘
```

---

## 4. Jerarquías de Navegación

### Canal
```
Distribuidores Nacionales
├── Segmento Oro
│   ├── Distribuidor A
│   │   ├── Sucursal A-1
│   │   └── Sucursal A-2
│   └── Distribuidor B
├── Segmento Plata
│   └── ...
└── Segmento Bronce
    └── ...
```

### Territorio
```
Nacional
├── Región Norte
│   ├── Nuevo León
│   │   ├── Monterrey
│   │   └── San Pedro
│   └── Chihuahua
├── Región Centro
│   ├── CDMX
│   └── Estado de México
├── Región Bajío
│   └── ...
└── Región Sur
    └── ...
```

### Portafolio
```
Portafolio USG (86 SKUs)
├── Tableros (11)
├── Plafones (17)
├── Suspensiones (11)
├── Adhesivos (9)
├── Perfiles Metálicos (11)
├── Yesos (4)
├── Accesorios (14)
├── Cintas (2)
├── Mallas de Refuerzo (1)
└── Membranas Impermeables (1)
```

---

## 5. Reglas de Negocio

| ID | Regla | Módulo Afectado |
|----|-------|-----------------|
| RN-01 | La elasticidad solo se muestra si hay suficiente robustez estadística | History, Simulator |
| RN-02 | Las recomendaciones distinguen price increase vs volume protection | Recommendations |
| RN-03 | El precio neto = precio lista - descuento - rebate | Todos |
| RN-04 | Los escenarios siempre se comparan contra un escenario base | Simulator |
| RN-05 | El nivel de confianza categoriza en alto / medio / bajo | Confidence |
| RN-06 | Sell-out solo se activa si existe data del distribuidor | Sell-out |
| RN-07 | Competidores solo aparece con datos robustos | Competitors |
| RN-08 | Cada recomendación incluye racional: elasticidad, margen, volumen, sensibilidad | Recommendations |
| RN-09 | El agente AI solo consulta datos, nunca los modifica (read-only) | Agent |
| RN-10 | El agente siempre usa herramientas para datos reales — nunca inventa números | Agent |

---

## 6. KPIs del Dashboard (Overview)

| KPI | Fórmula | Granularidad |
|-----|---------|-------------|
| Volumen Total | Σ volumen por período | Canal, Territorio, Categoría |
| Ingreso Total | Σ (precio neto × volumen) | Canal, Territorio, Categoría |
| Margen | Ingreso - Costo (si disponible) | Canal, Territorio, Categoría |
| Precio Neto Promedio | Σ precio neto / n transacciones | SKU, Segmento |
| Elasticidad Promedio | Media ponderada de elasticidades | Categoría, Segmento |
| Cobertura Modelada | % SKUs con elasticidad calculable | Global |
| Rebate Promedio | Σ rebate / n transacciones | Segmento, SKU |
