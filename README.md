# Minha Rotina — Dieta Semanal & Lembretes Importantes 💖

Aplicativo web completo, moderno, responsivo e instalável (PWA) desenvolvido com **React, TypeScript, Vite e Supabase (PostgreSQL)**, com suporte a **Web Push Notifications reais no iPhone (iOS 16.4+)** e tema **Smorphy Dark com Rosa Neon**.

---

## ✨ Identidade Visual — Smorphy Dark com Rosa Neon

- **Fundo:** Preto obsidiana e cinza espacial profundo (`#08090e`, `#0f1119`).
- **Destaque:** Rosa Neon vibrante (`#ff2a85`, `#ff007f`) com brilhos sutis (glow).
- **Cards:** Efeito Glassmorphism (`backdrop-filter: blur(20px)`), bordas translúcidas e sombras dinâmicas.
- **Tipografia:** Google Fonts *Outfit* (títulos modernos) e *Inter* (texto fluido e legível).
- **Responsividade Total:** Barra de navegação inferior elegante no celular e barra superior completa no computador.
- **Micro-interações:** Confetti comemorativo ao completar refeições e tarefas diárias.

---

## 📱 Navegação e Funcionalidades

### 1. Início (Dashboard)
- Saudação personalizada (`Olá, Carol! ✨`) e data atual formatada por extenso em português.
- Indicadores visuais de progresso (Refeições do dia, Lembretes pendentes, Concluídos hoje e Status Web Push).
- Banner de alerta pulsante para compromissos urgentes ou próximos do horário.
- Checklist interativo das refeições e lembretes de hoje com conclusão instantânea.
- Atalhos rápidos: `+ Novo Lembrete`, `+ Nova Refeição` e `⚡ Importar Dieta`.

### 2. Minha Dieta (Planejamento Semanal)
- Seletor dos 7 dias da semana (Segunda-feira a Domingo) com contadores de refeições.
- Barra de progresso diária com percentual de refeições concluídas.
- Refeições organizadas por horário e categoria:
  - *Café da manhã, Lanche da manhã, Almoço, Lanche da tarde, Jantar, Ceia*.
- Detalhes completos: horários, alimentos, porções, quantidades e observações.
- **Importador de Dieta do ChatGPT:**
  - Algoritmo inteligente que identifica dias da semana, horários, categorias, alimentos e porções colados diretamente do ChatGPT.
  - Pré-visualização interativa e editável antes de gravar no banco de dados.
  - Permite importar a semana inteira ou selecionar dias específicos.

### 3. Lembretes Importantes
- Central para gerenciar compromissos, tarefas, datas comemorativas, saúde e contas.
- **Filtros rápidos em chips:** *Hoje, Amanhã, Próximos 7 dias, Este mês, Todos, Atrasados, Concluídos e Favoritos*.
- **Visualização dupla:** Alternância entre **Modo Lista** e **Modo Calendário Mensal**.
- **Prioridades:** Indicadores visuais para *Baixa (Ciano)*, *Normal (Roxo)*, *Alta (Âmbar)* e *Urgente (Rosa Neon pulsante)*.
- **Recorrência sem duplicação:** Repetições diárias, semanais, em dias úteis, mensais ou anuais controladas via tabela `reminder_completions`.
- **Antecedência de Notificação:** No horário, 5 min, 15 min, 30 min, 1 hora ou 1 dia antes.

### 4. Histórico
- Registro permanente de refeições e lembretes concluídos com data e hora.
- Filtros por categoria e busca textual.
- Ações para restaurar itens para a rotina ativa ou excluir definitivamente com confirmação de segurança.

### 5. Configurações & iPhone Web Push Hub
- Guia passo a passo ilustrado para instalar o PWA no iPhone pelo Safari e ativar o Web Push.
- Botão para enviar uma **Notificação de Teste Real** diretamente no aparelho.
- Gerenciador de categorias personalizadas (criar novas cores e tags).
- Painel do Supabase: teste e conexão ao vivo com o banco de dados PostgreSQL ou alternância para modo local.

---

## 🔔 Notificações Push Reais no iPhone (iOS 16.4+)

A partir do iOS 16.4, o Safari no iPhone suporta Web Push Notifications desde que o app seja adicionado à Tela de Início:

1. Abra a URL do aplicativo no **Safari** do iPhone.
2. Toque no botão de **Compartilhar** (ícone do quadrado com a seta para cima no centro inferior).
3. Toque em **Adicionar à Tela de Início**.
4. Saia do Safari e **abra o aplicativo tocando no novo ícone na Tela de Início**.
5. Na aba **Configurações**, toque no botão **Ativar Notificações no Aparelho**.
6. Selecione **Permitir** na janela nativa do iOS.
7. Toque em **Enviar Notificação de Teste Agora** para validar a notificação no seu iPhone!

---

## 🗄️ Estrutura do Banco de Dados PostgreSQL (Supabase)

O esquema está localizado em `supabase/migrations/20261017000001_initial_schema.sql` e inclui:

1. `profiles`: Dados do perfil e nome do usuário.
2. `meal_plans`: Planos de alimentação semanal.
3. `meals`: Refeições diárias com horários, categorias, alimentos e status.
4. `reminder_categories`: Categorias de lembrete com cores e ícones.
5. `reminders`: Lembretes com prioridades, datas, regras de repetição e avisos.
6. `reminder_completions`: Histórico de conclusões de ocorrências recorrentes (evita duplicação).
7. `push_subscriptions`: Registro de inscrições Web Push por usuário e dispositivo.
8. `notification_logs`: Prevenção de duplicatas no envio de avisos.
9. `user_settings`: Preferências de notificação e antecedência padrão.
10. **Row Level Security (RLS):** Ativado em todas as tabelas para garantir privacidade total dos dados.

---

## 🚀 Como Executar Localmente

### Pré-requisitos
- Node.js (v18+) e npm.

### Passo a Passo
```bash
# 1. Instalar dependências
npm install

# 2. Iniciar servidor de desenvolvimento
npm run dev
```

Acesse no navegador: `http://localhost:5173/` (ou a porta informada pelo Vite).

---

## 🌐 Publicação na Vercel

1. Envie o projeto para um repositório no GitHub ou GitLab.
2. Acesse [vercel.com](https://vercel.com) e importe o repositório.
3. Nas variáveis de ambiente (Environment Variables), adicione:
   - `VITE_SUPABASE_URL`: sua Project URL do Supabase.
   - `VITE_SUPABASE_ANON_KEY`: sua Anon public key do Supabase.
   - `VITE_VAPID_PUBLIC_KEY`: sua chave pública VAPID para Web Push.
4. Clique em **Deploy**. O Vercel provisionará HTTPS automaticamente, permitindo o funcionamento pleno do Service Worker e das notificações no iPhone!
