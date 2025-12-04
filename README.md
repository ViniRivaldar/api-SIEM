# API SIEM - Security Information and Event Management

API REST para consulta e visualização de logs de segurança analisados por IA, fornecendo dados estruturados para dashboards e aplicações frontend.

## 📋 Sobre o Projeto

Esta API é a camada intermediária entre o banco de dados PostgreSQL (que contém logs e análises de segurança) e aplicações frontend de visualização. Ela agrega, filtra e transforma dados de auditoria e análises de ameaças em endpoints otimizados para consumo por dashboards SIEM.

## 🏗️ Arquitetura do Ecossistema

```
┌──────────────┐
│  Aplicação   │
│+ Middleware  │
└──────┬───────┘
       │ Coleta logs
       ▼
┌──────────────┐
│ PostgreSQL   │
│ audit_logs   │
└──────┬───────┘
       │
       │ ◄──── Análise ────┐
       │                    │
       ▼                    │
┌──────────────┐    ┌──────┴──────┐
│ PostgreSQL   │    │ Orquestrador│
│audit_analysis│◄───│  + Gemini   │
└──────┬───────┘    └─────────────┘
       │
       │ Consulta agregada
       ▼
┌──────────────┐
│  API SIEM    │  ◄─── Você está aqui
│  (Express)   │
└──────┬───────┘
       │ JSON
       ▼
┌──────────────┐
│   Frontend   │
│  Dashboard   │
└──────────────┘
```

## 🚀 Funcionalidades

### 📊 Dashboard Stats
- Total de logs registrados
- Contagem de logs suspeitos (threat_score 1-49)
- Contagem de logs maliciosos (threat_score ≥ 50)

### 📋 Listagem de Logs
- Filtros por tipo: todos, suspeitos, maliciosos
- Paginação configurável
- Ordenação por timestamp (mais recentes primeiro)

### 🔍 Detalhes Completos
- Visualização detalhada de cada log
- Dados brutos + análise de IA
- Mapeamento MITRE ATT&CK
- Ações recomendadas

### 📈 Estatísticas e Analytics
- Top IPs com mais requisições
- Timeline de atividades suspeitas
- Logs mais recentes
- Agregações personalizadas

## 📦 Instalação

### Pré-requisitos

- Node.js 18+
- PostgreSQL com tabelas `audit_logs` e `audit_analysis` populadas
- npm ou yarn

### Passos

1. **Clone o repositório:**
```bash
git clone <url-do-repositorio>
cd api-siem
```

2. **Instale as dependências:**
```bash
npm install
```

3. **Configure variáveis de ambiente:**
```bash
cp .env.example .env
```

Edite o arquivo `.env`:
```env
DATABASE_URL=postgresql://usuario:senha@localhost:5432/nome_do_banco
PORT=3000
```

4. **Inicie o servidor:**
```bash
node app.js
```

O servidor estará disponível em `http://localhost:3000`

## 🎯 Endpoints da API

### 1. Dashboard Stats

Retorna estatísticas gerais para cards de resumo.

```http
GET /api/dashboard/stats
```

**Resposta:**
```json
{
  "total_logs": 1500,
  "logs_suspeitos": 234,
  "logs_maliciosos": 42
}
```

**Critérios:**
- **Suspeitos**: `threat_score > 0 AND threat_score < 50`
- **Maliciosos**: `threat_score >= 50`

---

### 2. Lista Paginada de Logs

Busca logs com filtros e paginação.

```http
GET /api/logs?tipo=suspeitos&page=1&limit=50
```

**Query Parameters:**
| Parâmetro | Tipo | Padrão | Descrição |
|-----------|------|--------|-----------|
| `tipo` | string | - | `todos`, `suspeitos`, `maliciosos` |
| `page` | integer | 1 | Número da página |
| `limit` | integer | 50 | Registros por página (max: 50) |

**Resposta:**
```json
{
  "logs": [
    {
      "id": 1234,
      "timestamp": "2024-12-04T14:30:00Z",
      "action": "login",
      "status": 401,
      "email": "user@example.com",
      "ip": "203.0.113.42",
      "user_agent": "Mozilla/5.0...",
      "method": "POST",
      "threat_score": 75,
      "priority": "high",
      "detection_rule": "Brute Force - Multiple Failed Logins",
      "confidence": 0.92
    }
  ],
  "total": 234,
  "page": 1,
  "totalPages": 5
}
```

---

### 3. Detalhes Completos de um Log

Retorna todos os campos de um log específico + análise completa.

```http
GET /api/logs/:id
```

**Exemplo:** `GET /api/logs/1234`

**Resposta:**
```json
{
  "id": 1234,
  "timestamp": "2024-12-04T14:30:00Z",
  "action": "login",
  "status": 401,
  "email": "user@example.com",
  "email_raw": "user@example.com",
  "ip": "203.0.113.42",
  "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)...",
  "headers": {
    "user-agent": "Mozilla/5.0...",
    "x-forwarded-for": "203.0.113.42"
  },
  "request_body": {
    "email": "user@example.com",
    "password": "<REDACTED>"
  },
  "threats": null,
  "reason": null,
  "user_id": null,
  "response_time": 150.5,
  "db_query_time": 45.2,
  "request_size": 342,
  "method": "POST",
  "protocol": "HTTP/1.1",
  "user_exists": true,
  "error_message": "Invalid credentials",
  "error_stack": null,
  "log_threat_score": null,
  "analysis_id": 567,
  "analysis_threat_score": 75,
  "confidence": 0.92,
  "detection_rule": "Brute Force - Multiple Failed Logins",
  "priority": "high",
  "mitre_matches": [
    {
      "tactic": "Credential Access",
      "technique_id": "T1110.001",
      "technique_name": "Password Guessing",
      "rationale": "15 failed login attempts in 2 minutes from same IP"
    }
  ],
  "recommended_actions": [
    "Rate-limit IP immediately",
    "Enable MFA for affected account",
    "Alert user of suspicious activity"
  ],
  "notes": "IP shows pattern consistent with credential stuffing attack",
  "analysis_created_at": "2024-12-04T14:31:00Z"
}
```

---

### 4. Logs Mais Recentes

Retorna os últimos N logs ordenados por timestamp.

```http
GET /api/logs/recent?limit=10
```

**Query Parameters:**
| Parâmetro | Tipo | Padrão | Descrição |
|-----------|------|--------|-----------|
| `limit` | integer | 10 | Quantidade de logs |

**Resposta:**
```json
[
  {
    "id": 1500,
    "timestamp": "2024-12-04T15:00:00Z",
    "action": "register",
    "status": 201,
    "email": "newuser@example.com",
    "ip": "192.168.1.100",
    "threat_score": 5,
    "priority": "low",
    "detection_rule": null
  }
]
```

---

### 5. Top IPs

Lista IPs com mais requisições e suas estatísticas de ameaças.

```http
GET /api/stats/top-ips?limit=10
```

**Query Parameters:**
| Parâmetro | Tipo | Padrão | Descrição |
|-----------|------|--------|-----------|
| `limit` | integer | 10 | Quantidade de IPs |

**Resposta:**
```json
[
  {
    "ip": "203.0.113.42",
    "total_requests": 250,
    "malicious_count": 15,
    "max_threat_score": 85
  },
  {
    "ip": "198.51.100.10",
    "total_requests": 180,
    "malicious_count": 0,
    "max_threat_score": 10
  }
]
```

---

### 6. Timeline de Atividades

Agregação de logs por hora para visualização em gráficos.

```http
GET /api/stats/timeline?hours=24
```

**Query Parameters:**
| Parâmetro | Tipo | Padrão | Descrição |
|-----------|------|--------|-----------|
| `hours` | integer | 24 | Janela de tempo (horas) |

**Resposta:**
```json
[
  {
    "hour": "2024-12-04T14:00:00Z",
    "total": 45,
    "suspeitos": 8,
    "maliciosos": 2
  },
  {
    "hour": "2024-12-04T13:00:00Z",
    "total": 52,
    "suspeitos": 12,
    "maliciosos": 1
  }
]
```

## 🗂️ Estrutura do Projeto

```
api-siem/
├── .gitignore
├── .env
├── README.md
├── package.json
├── package-lock.json
├── app.js              # Aplicação Express + rotas
└── db.js               # Pool de conexão PostgreSQL
```

## 🔧 Tecnologias

- **Express 5.1**: Framework web moderno
- **pg 8.16**: Driver PostgreSQL nativo
- **cors 2.8**: Middleware CORS para frontend
- **dotenv 17.2**: Gerenciamento de variáveis de ambiente

## 🔐 Segurança

### Configuração CORS

O CORS está habilitado para todos os domínios por padrão. **Em produção**, restrinja:

```javascript
// app.js
app.use(cors({
  origin: 'https://seu-frontend.com',
  methods: ['GET'],
  credentials: true
}));
```

### SSL no PostgreSQL

Para conexões seguras em produção:

```javascript
// db.js
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: true, // Ativar validação de certificado
    ca: fs.readFileSync('/path/to/ca-certificate.crt')
  }
});
```

### Proteção contra SQL Injection

A API usa **queries parametrizadas** (`$1`, `$2`) em todas as operações, prevenindo SQL injection automaticamente.

## 📊 Integração com Frontend

### Exemplo: Fetch com JavaScript

```javascript
// Buscar stats do dashboard
async function getDashboardStats() {
  const response = await fetch('http://localhost:3000/api/dashboard/stats');
  const data = await response.json();
  
  console.log(`Total: ${data.total_logs}`);
  console.log(`Suspeitos: ${data.logs_suspeitos}`);
  console.log(`Maliciosos: ${data.logs_maliciosos}`);
}

// Buscar logs maliciosos (página 1)
async function getMaliciousLogs() {
  const response = await fetch(
    'http://localhost:3000/api/logs?tipo=maliciosos&page=1&limit=20'
  );
  const data = await response.json();
  
  data.logs.forEach(log => {
    console.log(`[${log.priority.toUpperCase()}] ${log.email} - ${log.detection_rule}`);
  });
}
```

### Exemplo: React Hook

```jsx
import { useState, useEffect } from 'react';

function useDashboardStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:3000/api/dashboard/stats')
      .then(res => res.json())
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch(err => console.error(err));
  }, []);

  return { stats, loading };
}

// Uso no componente
function Dashboard() {
  const { stats, loading } = useDashboardStats();

  if (loading) return <p>Carregando...</p>;

  return (
    <div>
      <h1>Dashboard SIEM</h1>
      <div className="stats">
        <Card title="Total" value={stats.total_logs} />
        <Card title="Suspeitos" value={stats.logs_suspeitos} />
        <Card title="Maliciosos" value={stats.logs_maliciosos} />
      </div>
    </div>
  );
}
```

## 🚀 Deploy

### Produção com PM2

```bash
# Instalar PM2
npm install -g pm2

# Iniciar aplicação
pm2 start app.js --name api-siem

# Configurar auto-restart
pm2 startup
pm2 save

# Monitorar
pm2 logs api-siem
pm2 monit
```

### Docker

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["node", "app.js"]
```

**docker-compose.yml:**
```yaml
version: '3.8'

services:
  api-siem:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://user:pass@postgres:5432/siem_db
      - PORT=3000
    depends_on:
      - postgres
    restart: unless-stopped

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=siem_db
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres_data:
```

### Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name api-siem.example.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

## 📈 Performance

### Otimizações Implementadas

✅ **Connection Pooling**: Pool de conexões PostgreSQL reutilizáveis  
✅ **Índices no DB**: Queries otimizadas com índices em `timestamp`, `threat_score`, `priority`  
✅ **Paginação**: Limita resultados para evitar overload  
✅ **LEFT JOIN**: Permite logs sem análise (análise pode vir depois)

### Índices Recomendados

```sql
-- Otimizar queries de timeline
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);

-- Otimizar filtros por threat_score
CREATE INDEX idx_audit_analysis_threat_score ON audit_analysis(threat_score);

-- Otimizar JOIN principal
CREATE INDEX idx_audit_analysis_log_id ON audit_analysis(log_id);

-- Otimizar top IPs
CREATE INDEX idx_audit_logs_ip ON audit_logs(ip);
```

## 🐛 Troubleshooting

### Erro: "ECONNREFUSED" ao conectar no PostgreSQL

**Solução:**
```bash
# Verificar se PostgreSQL está rodando
sudo systemctl status postgresql

# Testar conexão manual
psql "$DATABASE_URL"

# Verificar firewall
sudo ufw allow 5432/tcp
```

### Erro: "relation audit_analysis does not exist"

**Solução:**  
A tabela `audit_analysis` precisa ser criada. Execute:

```sql
CREATE TABLE audit_analysis (
    id SERIAL PRIMARY KEY,
    log_id INTEGER NOT NULL REFERENCES audit_logs(id),
    threat_score INTEGER CHECK (threat_score BETWEEN 0 AND 100),
    confidence DECIMAL(3,2) CHECK (confidence BETWEEN 0 AND 1),
    detection_rule VARCHAR(255),
    priority VARCHAR(20) CHECK (priority IN ('low', 'medium', 'high')),
    mitre_matches JSONB,
    recommended_actions JSONB,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(log_id)
);
```

### Logs retornam valores null em campos de análise

**Causa:** Logs ainda não foram analisados pelo orquestrador.

**Solução:** Execute o pipeline de análise:
```bash
cd ../orquestrador
python main.py
```

### CORS bloqueado no frontend

**Solução temporária (dev):**
```javascript
// app.js
app.use(cors()); // Já implementado
```

**Solução produção:**
```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173'
}));
```

## 🔄 Workflow Completo

1. **Aplicação com Middleware** → Captura logs → `audit_logs`
2. **Orquestrador** → Analisa logs → `audit_analysis`
3. **API SIEM** → Agrega dados → JSON para frontend
4. **Frontend Dashboard** → Visualiza dados

## 📝 Roadmap

- [ ] Autenticação JWT
- [ ] Rate limiting por IP
- [ ] Cache com Redis
- [ ] WebSocket para atualizações em tempo real
- [ ] Exportação de relatórios (PDF, CSV)
- [ ] API de alertas configuráveis
- [ ] Suporte a múltiplos tenants

## 🤝 Contribuindo

Contribuições são bem-vindas! Para contribuir:

1. Fork o projeto
2. Crie uma branch: `git checkout -b feature/nova-funcionalidade`
3. Commit suas mudanças: `git commit -m 'Adiciona nova funcionalidade'`
4. Push: `git push origin feature/nova-funcionalidade`
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença ISC.

---

**Desenvolvido com ❤️ para análise de segurança e SOC teams**
