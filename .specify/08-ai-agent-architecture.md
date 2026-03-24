# Fase AI — Arquitectura del Agente Conversacional

## USG Pricing Decision Engine

---

## 1. Propósito

El agente AI permite al equipo de pricing consultar datos, analizar tendencias y simular escenarios usando lenguaje natural. En lugar de navegar entre módulos y aplicar filtros manualmente, el usuario pregunta directamente:

- "¿Cuál es el revenue total por segmento?"
- "¿Por qué bajó el margen en el Norte?"
- "Simula un aumento del 5% en Tableros"

El agente ve lo que el usuario ve (página actual, filtros activos) y usa herramientas para consultar datos reales — nunca inventa números.

---

## 2. Arquitectura LangGraph (Multi-Modelo)

```
                        ┌─────────────────────┐
          Mensaje  ───► │   Orchestrator       │
          + contexto    │   (Claude Sonnet 4)  │
          de página     │                      │
                        │   Clasifica intent:  │
                        │   simple / deep /    │
                        │   direct             │
                        └─────┬───────┬────────┘
                              │       │
                  ┌───────────┘       └───────────┐
                  ▼                               ▼
        ┌─────────────────┐             ┌─────────────────┐
        │  Tool Executor   │             │  Direct Response │
        │  (Sonnet — fast) │             │  (Sonnet)        │
        │                  │             │  Saludos,        │
        │  Ejecuta 1-7     │             │  off-topic       │
        │  tools en loop   │             └────────┬────────┘
        │  ReAct (max 5)   │                      │
        └────────┬─────────┘                      ▼ END
                 │
        route="simple"           route="deep"
            │                        │
            ▼                        ▼
  ┌─────────────────┐    ┌─────────────────┐
  │   Synthesizer    │    │  Deep Analyst    │
  │   (Sonnet)       │    │  (Claude Opus 4) │
  │                  │    │                  │
  │   Formatea       │    │  Análisis causal │
  │   respuesta      │    │  y estratégico   │
  └────────┬─────────┘    └────────┬─────────┘
           │                       │
           ▼                       ▼
          END                 Synthesizer → END
```

### Nodos

| Nodo | Modelo | Función |
|------|--------|---------|
| **Orchestrator** | Claude Sonnet 4 (`claude-sonnet-4-20250514`) | Clasifica el intent del usuario en `simple` (datos), `deep` (análisis causal/estratégico), o `direct` (saludo/off-topic) |
| **Tool Executor** | Claude Sonnet 4 | Ejecuta herramientas en loop ReAct. Máximo 5 iteraciones por pregunta |
| **Deep Analyst** | Claude Opus 4 (`claude-opus-4-20250514`) | Recibe datos pre-obtenidos y genera análisis profundo con correlaciones, hipótesis causales, y recomendaciones. Solo se invoca cuando route="deep" |
| **Synthesizer** | Claude Sonnet 4 | Formatea la respuesta final en español con números MXN y estructura clara |
| **Direct Response** | Claude Sonnet 4 | Responde saludos y preguntas que no requieren datos |

### Routing

```
Usuario pregunta → Orchestrator clasifica:

"¿Cuál es el revenue?"          → simple  → Tool Executor → Synthesizer
"¿Por qué bajó el margen?"     → deep    → Tool Executor → Deep Analyst → Synthesizer
"Hola, ¿qué puedes hacer?"     → direct  → Direct Response
```

---

## 3. Herramientas (Tools)

Las 7 tools reutilizan la lógica existente de los API routers — no duplican queries.

| # | Tool | Descripción | Parámetros | Retorna |
|---|------|-------------|------------|---------|
| 1 | `get_overview_kpis` | KPIs generales del portafolio | `segment?`, `territory_id?`, `category_id?`, `customer_id?` | `{total_volume, total_revenue, avg_net_price, avg_rebate, n_customers, n_skus, n_territories}` |
| 2 | `get_revenue_by_dimension` | Desglose revenue/volumen por dimensión | `dimension` (category/segment/territory), filtros opcionales | `[{name, volume, revenue}]` |
| 3 | `get_price_trends` | Tendencias mensuales de precio/volumen | `segment?`, `territory_id?`, `category_id?`, `customer_id?` | `[{period, volume, revenue, net_price, list_price, rebate}]` |
| 4 | `get_elasticity` | Elasticidades de precio por entidad | `node_type?` (category/sku/segment/territory), `node_id?`, `confidence_level?` | `[{node_type, node_id, node_name, coefficient, confidence_level, p_value, r_squared, sample_size}]` |
| 5 | `simulate_price_change` | Simular impacto de cambio de precio | `price_change_pct` (requerido), `product_id?`, `category_id?`, `segment?` | `{base_price, base_volume, elasticity_used, new_price, new_volume, new_revenue, new_margin, delta_*}` |
| 6 | `get_recommendations` | Recomendaciones de pricing | `segment?`, `category_id?`, `action_type?` (increase/protect/decrease), `confidence_level?`, `limit?` | `[{product_name, category_name, segment, action_type, suggested_change_pct, expected_impact_*, confidence_level, rationale}]` |
| 7 | `get_passthrough_analysis` | Descomposición de precio (lista/descuento/rebate/neto) | `dimension` (segment/category), filtros opcionales | `[{name, avg_list_price, avg_discount, avg_rebate, avg_net_price, rebate_pct, discount_pct, volume}]` |

### Origen del código

Cada tool llama directamente a las mismas funciones de query que usan los endpoints existentes:

- Tools 1-2: Reutilizan patrones de `backend/app/api/overview.py`
- Tool 3: Reutiliza patrones de `backend/app/api/history.py`
- Tool 4: Reutiliza patrones de `backend/app/api/history.py` (elasticities)
- Tool 5: Llama a `backend/app/analytics/prediction_model.py` → `predict_scenario()`
- Tool 6: Reutiliza patrones de `backend/app/api/recommendations.py`
- Tool 7: Reutiliza patrones de `backend/app/api/passthrough.py`

Helpers compartidos: `_parse_ids()`, `_parse_strs()`, `_filter_ids()` de `backend/app/api/overview.py`.

---

## 4. System Prompts

### Orchestrator (dinámico — recibe contexto de página)

```
Eres un analista experto en pricing B2B que trabaja con el USG Pricing
Decision Engine para el canal de distribuidores de USG en México.

SIEMPRE responde en español.

CONTEXTO ACTUAL DEL USUARIO:
- Página: {current_page}
- Filtros activos: {filters}
- Lo que está viendo: {data_summary}

INSTRUCCIONES:
1. Usa las herramientas para consultar datos REALES. NUNCA inventes números.
2. Datos concretos → usa tools directamente.
3. Análisis causal/estratégico → obtén datos con tools, luego analiza a fondo.
4. Formatea: moneda $1,234.56 MXN, porcentajes 1 decimal, miles con separador.
5. Sé conciso. Usa bullets.
6. Si no puedes responder, dilo claramente.

DOMINIO: 86 SKUs, 10 categorías, 75 distribuidores (oro/plata/bronce),
29 territorios, 24 meses. Precio Neto = Lista - Descuento - Rebate.
```

### Deep Analyst (estático)

```
Eres un consultor senior de pricing B2B con 20 años de experiencia en
materiales de construcción en México.

INSTRUCCIONES:
1. Responde en español.
2. Identifica patrones, correlaciones y causas probables.
3. Recomendaciones accionables con números específicos.
4. Contexto B2B: rebates, segmentos, territorios, estacionalidad.
5. Estructura: Hallazgo → Análisis → Recomendación.
6. Formatea: $1,234.56 MXN, porcentajes 1 decimal.
```

### Synthesizer (estático)

```
Formatea respuestas de análisis de pricing.
Español. Bullets. Números formateados. Tono profesional.
No agregues info que no esté en los datos.
```

---

## 5. Contrato API — Endpoint SSE

### `POST /api/agent/chat`

**Request:**
```json
{
  "messages": [
    {"role": "user", "content": "¿Cuál es el revenue por segmento?"},
    {"role": "assistant", "content": "El revenue total..."},
    {"role": "user", "content": "¿Y por categoría?"}
  ],
  "context": {
    "current_page": "/history",
    "filters": {"segment": "oro"},
    "data_summary": "Viendo tabla de elasticidades filtrada por segmento oro"
  }
}
```

**Response:** `Content-Type: text/event-stream`

```
data: {"type": "status", "text": "Analizando tu pregunta..."}

data: {"type": "status", "text": "Consulté: get_revenue_by_dimension"}

data: {"type": "text_delta", "text": "Aquí tienes el **revenue por segmento**:"}

data: {"type": "text_delta", "text": "\n\n- **Oro**: $144,593,244 MXN"}

data: {"type": "text_delta", "text": "\n- **Plata**: $111,644,505 MXN"}

data: {"type": "done"}
```

### Tipos de evento SSE

| Tipo | Significado | Frontend muestra |
|------|------------|------------------|
| `status` | El agente está procesando o consultando una herramienta | Indicador animado con el texto |
| `text_delta` | Fragmento de la respuesta final | Se acumula en la burbuja del asistente |
| `error` | Error (sin API key, timeout, etc.) | Mensaje de error en burbuja |
| `done` | Fin del stream | Desactiva el indicador de streaming |

---

## 6. Contexto de Página

El frontend envía automáticamente (via `usePageContext` hook):

| Campo | Fuente | Ejemplo |
|-------|--------|---------|
| `current_page` | `usePathname()` | `"/simulator"` |
| `filters` | `useFilters()` (Zustand store) | `{"segment": "oro", "territory_id": "5"}` |
| `data_summary` | `useChatStore.dataSummary` o auto-generado | `"Viendo Simulador. Filtros: segment=oro"` |

Esto permite al agente dar respuestas relevantes al contexto. Si el usuario está en `/passthrough` filtrado por "oro", el agente prioriza información de rebates del segmento oro.

---

## 7. Componentes Frontend

| Componente | Ubicación | Función |
|------------|-----------|---------|
| `ChatPanel` | `components/chat/ChatPanel.tsx` | Panel lateral colapsable (w-96) con header, mensajes, e input. Visible en todas las páginas |
| `ChatToggle` | `components/chat/ChatToggle.tsx` | Botón flotante bottom-right para abrir/cerrar. Badge con contador de respuestas |
| `ChatBubble` | `components/chat/ChatBubble.tsx` | Burbuja de mensaje. User = fondo rojo suave. Assistant = fondo gris con markdown rendering |
| `ChatInput` | `components/chat/ChatInput.tsx` | Textarea auto-resize. Enter envía, Shift+Enter nueva línea |
| `/agent` page | `app/agent/page.tsx` | Página dedicada full-width con preguntas sugeridas. Misma lógica que el panel |

### Store (Zustand)

`useChatStore` maneja: `messages[]`, `isOpen`, `isStreaming`, `currentStatus`, `dataSummary`, `sendMessage()`, `clearMessages()`.

La conversación vive en memoria — se pierde al refrescar. Máximo ~30 mensajes por sesión.

---

## 8. Manejo de Errores

| Escenario | Comportamiento |
|-----------|---------------|
| `ANTHROPIC_API_KEY` no configurada | SSE retorna evento `error` con mensaje claro. No se invoca el LLM |
| Timeout del LLM | El try/catch en `generate()` captura la excepción y envía evento `error` |
| Tool sin datos (query vacío) | La tool retorna `{"error": "No transaction data found..."}`. El agente lo comunica al usuario |
| Max iteraciones del loop ReAct (5) | El tool_executor retorna los resultados acumulados hasta ese punto |
| Request body inválido | FastAPI retorna 422 con detalle de validación (Pydantic) |

---

## 9. Restricciones de Seguridad

| Restricción | Implementación |
|-------------|---------------|
| **Read-only** | Las 7 tools solo hacen SELECT — ninguna modifica datos (RN-09) |
| **No inventa datos** | System prompt instruye usar tools para datos reales (RN-10) |
| **API key server-side** | La key vive solo en el backend. El frontend nunca la ve |
| **Max iteraciones** | Loop ReAct limitado a 5 ciclos para evitar loops infinitos |
| **Max mensajes** | Frontend limita a ~30 mensajes por conversación para no exceder contexto del LLM |
| **Mínima agencia** | El agente no puede crear escenarios, modificar recomendaciones, ni ejecutar seeds |

---

## 10. Archivos del Agente

```
backend/app/agent/
├── __init__.py
├── tools.py          # 7 funciones tool (queries a BD)
├── graph.py          # LangGraph: 4 nodos, routing, tool schemas
├── prompts.py        # 3 system prompts
└── state.py          # AgentState TypedDict

backend/app/api/
└── agent.py          # POST /api/agent/chat (SSE endpoint)

frontend/src/components/chat/
├── ChatPanel.tsx     # Panel lateral colapsable
├── ChatBubble.tsx    # Burbuja con markdown rendering
├── ChatInput.tsx     # Textarea + botón enviar
└── ChatToggle.tsx    # Botón flotante

frontend/src/hooks/
├── useChatStore.ts   # Zustand store (messages, SSE streaming)
└── usePageContext.ts # Contexto de página para el agente

frontend/src/app/agent/
└── page.tsx          # Página dedicada /agent
```
