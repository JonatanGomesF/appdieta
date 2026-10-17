-- =========================================================================
-- AGENDAMENTO AUTOMÁTICO DE NOTIFICAÇÕES VIA SUPABASE CRON (pg_cron + pg_net)
-- PROJETO: vwokepvlbjbqcrfdhfbw
-- =========================================================================

-- 1. Habilita extensões pg_cron e pg_net no banco de dados (se já não estiverem ativas)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. Agendamento para verificar e disparar lembretes a cada minuto
SELECT cron.schedule(
    'processar-lembretes-push-a-cada-minuto',
    '* * * * *', -- Executa a cada minuto
    $$
    SELECT net.http_post(
        url := 'https://vwokepvlbjbqcrfdhfbw.supabase.co/functions/v1/send-push-reminders',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer SUA_SERVICE_ROLE_KEY'
        ),
        body := '{}'::jsonb
    );
    $$
);

-- =========================================================================
-- COMANDOS ÚTEIS PARA CONSULTA NO SQL EDITOR:
-- =========================================================================

-- Para verificar se o agendamento está ativo:
-- SELECT * FROM cron.job;

-- Para consultar o histórico das últimas execuções:
-- SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;

-- Para desativar/remover o agendamento se desejar:
-- SELECT cron.unschedule('processar-lembretes-push-a-cada-minuto');
