# api-SIEM

Rotas disponíveis:

GET /api/dashboard/stats - Números dos cards

Retorna: { total_logs: 8, logs_suspeitos: 3, logs_maliciosos: 1 }


GET /api/logs?tipo=suspeitos&page=1&limit=50 - Lista paginada

tipo pode ser: todos, suspeitos, maliciosos


GET /api/logs/:id - Detalhes completos (todos os campos + análise)
GET /api/logs/recent?limit=10 - Últimos 10 logs
GET /api/stats/top-ips?limit=10 - IPs com mais requisições
GET /api/stats/timeline?hours=24 - Atividade por hora (útil para gráficos)