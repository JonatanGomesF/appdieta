# Configuração do Supabase e Notificações Push para iPhone (iOS 16.4+)

Este documento detalha o passo a passo completo para configurar o banco de dados PostgreSQL no Supabase, ativar o Row Level Security (RLS) e configurar as notificações Web Push para iPhone e navegadores desktop.

---

## 1. Passo a Passo no Supabase

### 1.1. Criar o Projeto no Supabase
1. Acesse [supabase.com](https://supabase.com) e crie uma conta gratuita (ou faça login).
2. Clique em **New Project**, dê o nome de `Minha Rotina`, defina uma senha segura para o banco e selecione a região mais próxima (ex: *São Paulo - sa-east-1*).
3. Aguarde cerca de 1 a 2 minutos até que o banco de dados seja provisionado.

### 1.2. Executar o Esquema do Banco de Dados
1. No menu lateral do Supabase, clique em **SQL Editor** (ícone de terminal `>_`).
2. Clique em **+ New Query**.
3. Abra o arquivo `supabase/migrations/20261017000001_initial_schema.sql` deste projeto.
4. Copie todo o conteúdo e cole no editor do Supabase.
5. Clique no botão verde **Run** (Executar).
6. Todas as 9 tabelas (`profiles`, `meal_plans`, `meals`, `reminders`, `reminder_categories`, `reminder_completions`, `push_subscriptions`, `notification_logs`, `user_settings`), índices e políticas RLS serão criadas instantaneamente.

### 1.3. Obter as Chaves de Acesso
1. No painel do Supabase, vá em **Project Settings** (ícone de engrenagem) > **API**.
2. Copie:
   - **Project URL** (ex: `https://xyzcompany.supabase.co`)
   - **Project API Keys** > `anon` `public` (chave pública anônima)
3. Você pode inserir essas chaves no arquivo `.env` do projeto ou colá-las diretamente na aba **Configurações** do próprio aplicativo!

---

## 2. Configuração de Notificações Push no iPhone (iOS 16.4+)

A Apple adicionou suporte a **Web Push Notifications** a partir do **iOS 16.4**, exigindo que o aplicativo seja instalado como PWA na Tela de Início.

### 2.1. Como a usuária instala no iPhone:
1. Abra o Safari no iPhone e acerte a URL do aplicativo (ex: no Vercel em HTTPS).
2. Toque no botão de **Compartilhar** (ícone de quadrado com seta para cima no centro inferior do Safari).
3. Role para baixo e selecione **Adicionar à Tela de Início** (+).
4. Confirme o nome "Minha Rotina" e toque em **Adicionar**.
5. Saia do Safari e **abra o aplicativo tocando no novo ícone na Tela de Início**.
6. Vá na aba **Configurações** ou no alerta da tela inicial e toque em **Ativar Notificações Push**.
7. O iOS exibirá o popup nativo: *"Minha Rotina gostaria de enviar notificações"*. Toque em **Permitir**.

### 2.2. Geração das Chaves VAPID
Para enviar notificações push autenticadas, você pode gerar um par de chaves VAPID público/privado executando no terminal:

```bash
npx web-push generate-vapid-keys
```

Isso retornará:
- `Public Key` (Coloque na variável de ambiente `VITE_VAPID_PUBLIC_KEY` no frontend)
- `Private Key` (Guarde exclusivamente nos Secrets do Supabase)

---

## 3. Implantação da Edge Function (Servidor Push)

Para implantar a função que verifica os lembretes a cada minuto e envia o push para o iPhone:

1. Instale o Supabase CLI (se já não tiver):
   ```bash
   npm i -g supabase
   ```
2. Faça login:
   ```bash
   supabase login
   ```
3. Vincule o projeto:
   ```bash
   supabase link --project-ref SEU_PROJETO_REF
   ```
4. Configure os Secrets na Edge Function:
   ```bash
   supabase secrets set VAPID_PUBLIC_KEY="SUA_CHAVE_PUBLICA_AQUI"
   supabase secrets set VAPID_PRIVATE_KEY="SUA_CHAVE_PRIVADA_AQUI"
   supabase secrets set VAPID_SUBJECT="mailto:contato@minharotina.app"
   ```
5. Envie a Edge Function:
   ```bash
   supabase functions deploy send-push-reminders --no-verify-jwt
   ```

6. Ative o cron job no SQL Editor do Supabase executando o conteúdo de `supabase/cron_schedule.sql`.

Pronto! O iPhone receberá os avisos pontualmente conforme a antecedência programada.
