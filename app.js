const express = require('express');
const db = require('./db');
const app = express();

app.use(express.json());

// ============ DASHBOARD STATS (Cards do topo) ============
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const stats = await db.query(`
      SELECT 
        COUNT(al.id) as total_logs,
        COUNT(CASE WHEN aa.threat_score > 0 AND aa.threat_score < 50 THEN 1 END) as logs_suspeitos,
        COUNT(CASE WHEN aa.threat_score >= 50 THEN 1 END) as logs_maliciosos
      FROM audit_logs al
      LEFT JOIN audit_analysis aa ON al.id = aa.log_id
    `);
    
    res.json({
      total_logs: parseInt(stats.rows[0].total_logs),
      logs_suspeitos: parseInt(stats.rows[0].logs_suspeitos),
      logs_maliciosos: parseInt(stats.rows[0].logs_maliciosos)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
});

// ============ LISTA DE LOGS (ao clicar nos cards) ============
app.get('/api/logs', async (req, res) => {
  try {
    const { tipo, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = '';
    
    if (tipo === 'todos') {
      whereClause = ''; // todos os logs
    } else if (tipo === 'suspeitos') {
      whereClause = "WHERE aa.threat_score > 0 AND aa.threat_score < 50";
    } else if (tipo === 'maliciosos') {
      whereClause = "WHERE aa.threat_score >= 50";
    }
    
    const result = await db.query(`
      SELECT 
        al.id,
        al.timestamp,
        al.action,
        al.status,
        al.email,
        al.ip,
        al.user_agent,
        al.method,
        aa.threat_score,
        aa.priority,
        aa.detection_rule,
        aa.confidence
      FROM audit_logs al
      LEFT JOIN audit_analysis aa ON al.id = aa.log_id
      ${whereClause}
      ORDER BY al.timestamp DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);
    
    // Total de registros para paginação
    const countResult = await db.query(`
      SELECT COUNT(*) 
      FROM audit_logs al
      LEFT JOIN audit_analysis aa ON al.id = aa.log_id
      ${whereClause}
    `);
    
    res.json({
      logs: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      totalPages: Math.ceil(countResult.rows[0].count / limit)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar logs' });
  }
});

// ============ DETALHES COMPLETOS DE UM LOG ============
app.get('/api/logs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(`
      SELECT 
        al.id,
        al.timestamp,
        al.action,
        al.status,
        al.email,
        al.email_raw,
        al.ip,
        al.user_agent,
        al.headers,
        al.request_body,
        al.threats,
        al.reason,
        al.user_id,
        al.response_time,
        al.db_query_time,
        al.request_size,
        al.method,
        al.protocol,
        al.user_exists,
        al.error_message,
        al.error_stack,
        al.threat_score as log_threat_score,
        aa.id as analysis_id,
        aa.threat_score as analysis_threat_score,
        aa.confidence,
        aa.detection_rule,
        aa.priority,
        aa.mitre_matches,
        aa.recommended_actions,
        aa.notes,
        aa.created_at as analysis_created_at
      FROM audit_logs al
      LEFT JOIN audit_analysis aa ON al.id = aa.log_id
      WHERE al.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Log não encontrado' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar detalhes do log' });
  }
});

// ============ LOGS MAIS RECENTES ============
app.get('/api/logs/recent', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const result = await db.query(`
      SELECT 
        al.id,
        al.timestamp,
        al.action,
        al.status,
        al.email,
        al.ip,
        aa.threat_score,
        aa.priority,
        aa.detection_rule
      FROM audit_logs al
      LEFT JOIN audit_analysis aa ON al.id = aa.log_id
      ORDER BY al.timestamp DESC
      LIMIT $1
    `, [limit]);
    
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar logs recentes' });
  }
});

// ============ ESTATÍSTICAS POR IP (top IPs com mais tentativas) ============
app.get('/api/stats/top-ips', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const result = await db.query(`
      SELECT 
        al.ip,
        COUNT(*) as total_requests,
        COUNT(CASE WHEN aa.threat_score >= 50 THEN 1 END) as malicious_count,
        MAX(aa.threat_score) as max_threat_score
      FROM audit_logs al
      LEFT JOIN audit_analysis aa ON al.id = aa.log_id
      GROUP BY al.ip
      ORDER BY total_requests DESC
      LIMIT $1
    `, [limit]);
    
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar top IPs' });
  }
});

// ============ ATIVIDADES SUSPEITAS POR PERÍODO ============
app.get('/api/stats/timeline', async (req, res) => {
  try {
    const { hours = 24 } = req.query;
    
    const result = await db.query(`
      SELECT 
        DATE_TRUNC('hour', al.timestamp) as hour,
        COUNT(*) as total,
        COUNT(CASE WHEN aa.threat_score > 0 AND aa.threat_score < 50 THEN 1 END) as suspeitos,
        COUNT(CASE WHEN aa.threat_score >= 50 THEN 1 END) as maliciosos
      FROM audit_logs al
      LEFT JOIN audit_analysis aa ON al.id = aa.log_id
      WHERE al.timestamp >= NOW() - INTERVAL '${hours} hours'
      GROUP BY hour
      ORDER BY hour DESC
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar timeline' });
  }
});

app.listen(3000, () => {
  console.log('🚀 SIEM API rodando na porta 3000');
});