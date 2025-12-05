// ====================================================================
// INSTRUÇÕES: Adicione este código no arquivo servico2/index.js
// Logo ANTES da linha "app.listen(PORT, ...)"
// ====================================================================

// ====================================================================
// 14. Rota GET /notificacoes (Listar Notificações)
// ====================================================================
app.get("/notificacoes", authorize, async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM notificacoes WHERE user_id = $1 ORDER BY created_at DESC",
            [req.userId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error("Erro ao listar notificações:", err);
        // Se a tabela não existir, retorna array vazio para não quebrar o front
        if (err.code === '42P01') {
            return res.json([]);
        }
        res.status(500).json({ error: "Erro interno ao listar notificações." });
    }
});

// ====================================================================
// 15. Rota PUT /notificacoes/:id/read (Marcar como lida)
// ====================================================================
app.put("/notificacoes/:id/read", authorize, async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query(
            "UPDATE notificacoes SET read = TRUE WHERE id = $1 AND user_id = $2",
            [id, req.userId]
        );
        res.json({ message: "Notificação marcada como lida." });
    } catch (err) {
        console.error("Erro ao atualizar notificação:", err);
        res.status(500).json({ error: "Erro interno ao atualizar notificação." });
    }
});

// Helper para criar notificação
async function createNotification(userId, message, type, eventId) {
    try {
        await pool.query(
            "INSERT INTO notificacoes (user_id, message, type, event_id) VALUES ($1, $2, $3, $4)",
            [userId, message, type, eventId]
        );
    } catch (err) {
        console.error("Erro ao criar notificação:", err);
    }
}

// ====================================================================
// MODIFICAÇÕES NECESSÁRIAS EM ROTAS EXISTENTES:
// ====================================================================

// 1. Na rota PUT /eventos/:id (atualizar evento), adicione ANTES de "res.json":

// Notificar participantes sobre a atualização
try {
    const participants = await pool.query("SELECT user_id FROM participacoes WHERE event_id = $1", [id]);
    for (const p of participants.rows) {
        if (p.user_id !== req.userId) { // Não notificar o próprio organizador
            await createNotification(p.user_id, `O evento "${result.rows[0].title}" foi atualizado.`, 'update', id);
        }
    }
} catch (notifErr) {
    console.error("Erro ao criar notificações:", notifErr);
}

// 2. Na rota DELETE /eventos/:id (deletar evento), ANTES de deletar, adicione:

// Buscar título e participantes antes de deletar
const eventInfo = await pool.query("SELECT title FROM eventos WHERE id = $1", [id]);
const participants = await pool.query("SELECT user_id FROM participacoes WHERE event_id = $1", [id]);

// Deleta o evento (CASCADE vai deletar as participações automaticamente)
await pool.query("DELETE FROM eventos WHERE id = $1", [id]);

// Notificar participantes sobre cancelamento
if (eventInfo.rows.length > 0) {
    for (const p of participants.rows) {
        if (p.user_id !== req.userId) {
            await createNotification(p.user_id, `O evento "${eventInfo.rows[0].title}" foi cancelado.`, 'cancel', null);
        }
    }
}
