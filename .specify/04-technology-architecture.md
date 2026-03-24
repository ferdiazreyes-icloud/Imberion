# Fase D — Arquitectura Tecnológica

## USG Pricing Decision Engine (MVP)

---

## 1. Diagrama de Infraestructura

```
                         ┌─────────────────────────┐
                         │       INTERNET           │
                         └────────────┬─────────────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    │                 │                   │
                    ▼                 ▼                   │
           ┌──────────────┐  ┌──────────────┐           │
           │   VERCEL      │  │  RAILWAY /    │           │
           │   (Frontend)  │  │  RENDER       │           │
           │               │  │  (Backend)    │           │
           │  Next.js App  │  │               │           │
           │  SSR + Static │  │  FastAPI App  │           │
           │               │  │  + Workers    │           │
           │  CDN Global   │  │               │           │
           └──────────────┘  └──────┬───────┘           │
                    │                 │                   │
                    │        ┌───────┴────────┐          │
                    │        │  PostgreSQL     │          │
                    │        │  (Railway /     │          │
                    │        │   Render DB)    │          │
                    │        └────────────────┘          │
                    │                                     │
                    └──────── REST API (HTTPS) ──────────┘
```

---

## 2. Stack Tecnológico Detallado

### Frontend
| Componente | Tecnología | Versión | Propósito |
|------------|-----------|---------|-----------|
| Framework | Next.js | 14+ | SSR, routing, optimización |
| UI Library | React | 18+ | Componentes reactivos |
| Styling | Tailwind CSS | 3.x | Utility-first CSS |
| Components | shadcn/ui | latest | Componentes base accesibles |
| Charts | Recharts | 2.x | Gráficos interactivos |
| State | Zustand | 4.x | Estado global ligero |
| Data fetching | TanStack Query | 5.x | Cache, refetch, loading states |
| Tables | TanStack Table | 8.x | Tablas con sorting, filtros |
| Forms | React Hook Form | 7.x | Formularios de escenarios |
| Export | xlsx + jspdf | latest | Exportación Excel y PDF |
| TypeScript | TypeScript | 5.x | Type safety |

### Backend
| Componente | Tecnología | Versión | Propósito |
|------------|-----------|---------|-----------|
| Framework | FastAPI | 0.100+ | API REST async |
| ORM | SQLAlchemy | 2.x | Mapeo objeto-relacional |
| Migrations | Alembic | 1.x | Versionado de schema |
| Validation | Pydantic | 2.x | Schemas request/response |
| Analytics | pandas | 2.x | Manipulación de datos |
| Statistics | scipy + statsmodels | latest | Elasticidades y regresiones |
| ML | scikit-learn | 1.x | Modelos predictivos |
| Server | Uvicorn | latest | ASGI server |

### AI / LLM Agent
| Componente | Tecnología | Versión | Propósito |
|------------|-----------|---------|-----------|
| Agent framework | LangGraph | 0.4+ | Flujos cíclicos multi-agente con estado |
| LLM adapter | langchain-anthropic | 0.3+ | Integración con Claude API |
| LLM core | langchain-core | 0.3+ | Tipos base (messages, tools) |
| LLM orchestrator | Claude Sonnet 4 | claude-sonnet-4-20250514 | Clasificación de intent, ejecución de tools, síntesis |
| LLM deep analysis | Claude Opus 4 | claude-opus-4-20250514 | Análisis causal y estratégico profundo |

### Infraestructura
| Componente | Tecnología | Propósito |
|------------|-----------|-----------|
| Frontend hosting | Vercel | Deploy + CDN |
| Backend hosting | Railway o Render | PaaS con soporte Python |
| Database | PostgreSQL 16 | Base de datos relacional |
| Dev containers | Docker + docker-compose | Desarrollo local |

---

## 3. Configuración de Desarrollo Local

### docker-compose.yml (referencia)
```yaml
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: imberion
      POSTGRES_USER: imberion
      POSTGRES_PASSWORD: dev_password
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      DATABASE_URL: postgresql://imberion:dev_password@db:5432/imberion
    depends_on:
      - db
    volumes:
      - ./backend:/app

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:8000
    depends_on:
      - backend
    volumes:
      - ./frontend:/app

volumes:
  pgdata:
```

---

## 4. Seguridad (MVP)

| Aspecto | Implementación MVP | Evolución futura |
|---------|-------------------|-----------------|
| Autenticación | Basic auth o API key simple | OAuth2 / SSO corporativo |
| Autorización | Sin roles complejos | RBAC por módulo |
| Datos | Datos mock, sin PII real | Encriptación at rest |
| API | HTTPS (Vercel/Railway default) | Rate limiting + API gateway |
| CORS | Configurado solo para frontend | Whitelist estricta |

---

## 5. Performance (Targets MVP)

| Métrica | Target | Cómo |
|---------|--------|------|
| Carga inicial | < 3s | SSR + code splitting |
| Cambio de filtros | < 1s | TanStack Query cache |
| Cálculo de escenario | < 3s | Pre-computed elasticities |
| Exportación informe | < 5s | Server-side generation |
| Tamaño bundle | < 500KB gzip | Tree shaking + lazy loading |

---

## 6. Monitoreo (MVP mínimo)

| Aspecto | Herramienta | Costo |
|---------|-------------|-------|
| Frontend errors | Vercel Analytics (incluido) | Free |
| Backend logs | Railway/Render logs | Incluido |
| API health | `/api/health` endpoint | Gratis |
| Uptime | UptimeRobot (free tier) | Free |
