# 🚀 Guia para Colocar em Produção

## Status Atual
✅ **Build completo** e testado localmente  
✅ **Dependências** instaladas (Next.js 16.4.5, React 19, Supabase)  
✅ **Autenticação** implementada (Supabase)  
✅ **Docker** configurado  

---

## 📋 Checklist de Produção

### 1. **Variáveis de Ambiente** 🔑
- [ ] **SUPABASE_URL** - URL da sua conta Supabase em produção
  - Obter em: https://app.supabase.com → Project Settings → API
- [ ] **SUPABASE_PUBLISHABLE_KEY** - Chave publicável do Supabase
  - Obter em: https://app.supabase.com → Project Settings → API
- [ ] **SITE_URL** - URL da sua aplicação em produção
  - Exemplo: `https://seu-dominio.com.br` (sem trailing slash)
- [ ] **SUPABASE_SERVICE_ROLE_KEY** *(opcional, apenas se precisar de operações server-side especiais)*

> ⚠️ **NUNCA** commite `.env.local` ou variáveis secretas no Git!

**Como fazer:**
1. Crie um arquivo `.env.production.local` (não será versionado)
2. Ou configure as variáveis no painel do seu provider de hosting

---

### 2. **Supabase - Preparação da Produção** 🗄️
- [ ] Criar um novo projeto Supabase para produção (ou usar um específico)
- [ ] Executar as migrações do banco de dados
  - Verificar pasta `supabase/migrations/`
  - Consultar documentação do Supabase sobre how to run migrations
- [ ] Configurar **Row Level Security (RLS)** nas tabelas
  - Exemplo:
    ```sql
    ALTER TABLE surveys ENABLE ROW LEVEL SECURITY;
    ALTER TABLE responses ENABLE ROW LEVEL SECURITY;
    ```
- [ ] Criar políticas de acesso apropriadas
  - Usuários autenticados só veem seus dados
  - Respondentes só podem criar respostas
- [ ] Configurar **email templates** (se usar o serviço de email do Supabase)
- [ ] Testar autenticação e permissões

**Checklist Supabase:**
```
Supabase Project → Settings
✓ API → URLs e Keys corretas
✓ Auth → Providers (Email/Password ativado)
✓ Database → Backups configurados
✓ Security → JWT Settings revisados
```

---

### 3. **Certificado SSL/HTTPS** 🔒
- [ ] Domínio configurado com SSL/TLS válido
- [ ] SITE_URL deve ser `https://seu-dominio.com`
- [ ] Redirecionamento automático HTTP → HTTPS

---

### 4. **Build Otimizado para Produção** ⚡
```bash
# Verificar se build está otimizado
npm run build

# Testar o build localmente
npm start
```

- [ ] Build conclui sem erros
- [ ] Sem warnings críticos
- [ ] Tamanho aceitável (atual: ~527 MB)

---

### 5. **Docker & Deployment** 🐳

#### Opção A: **Hostinger, AWS, DigitalOcean, Heroku, Render**
```bash
# Build a imagem Docker
docker build -t sistema-web:latest .

# Testar localmente
docker run -p 3000:3000 \
  -e SUPABASE_URL="https://seu-projeto.supabase.co" \
  -e SUPABASE_PUBLISHABLE_KEY="sua-chave" \
  -e SITE_URL="https://seu-dominio.com" \
  sistema-web:latest
```

#### Opção B: **Docker Compose**
```bash
docker-compose -f compose.production.yaml up -d
```

- [ ] Dockerfile configurado (`target: runner`)
- [ ] `compose.production.yaml` com variáveis corretas
- [ ] Testado localmente com Docker
- [ ] Registry do Docker configurado (se usar cloud)

---

### 6. **Performance & Segurança** 🛡️

#### Performance
- [ ] Enable caching headers (configurar Next.js cache)
- [ ] CDN configurado para `/public` e `/.next/static/`
- [ ] Comprimir respostas (gzip ativado)
- [ ] Lazy loading de componentes pesados

#### Segurança
- [ ] Headers de segurança configurados no `next.config.ts`:
  ```typescript
  async headers() {
    return [{
      source: '/:path*',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-XSS-Protection', value: '1; mode=block' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      ],
    }];
  }
  ```
- [ ] CORS configurado corretamente
- [ ] Rate limiting implementado (se necessário)
- [ ] SQL Injection: usar Supabase com prepared statements ✓
- [ ] CSRF protection: Next.js já inclui ✓

---

### 7. **Monitoramento & Logs** 📊

- [ ] Logs configurados (console, arquivo ou serviço)
- [ ] Error tracking (ex: Sentry, Rollbar)
- [ ] Uptime monitoring (ex: UptimeRobot)
- [ ] Database backups automáticos (Supabase faz isso)
- [ ] Alertas configurados

---

### 8. **Domínio & DNS** 🌐
- [ ] Registrar domínio (ex: seu-dominio.com.br)
- [ ] Configurar DNS
  - Apontar `A` record para o IP do servidor
  - Ou usar `CNAME` para o seu provider de hosting
- [ ] Email MX records (se usar email)
- [ ] SPF/DKIM/DMARC (se usar email)

---

### 9. **CI/CD Pipeline** 🔄
- [ ] GitHub Actions / GitLab CI configurado
- [ ] Deploy automático ao fazer push em `main`
- [ ] Testes rodam antes de deploy
- [ ] Rollback automático se falhar

**Exemplo GitHub Actions:**
```yaml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '22'
      - run: npm ci && npm run build
      - run: npm test  # Se tiver testes
      # Deploy steps aqui...
```

---

### 10. **Testes Finais** ✅
- [ ] Login funciona
- [ ] Criar pesquisa
- [ ] Responder pesquisa
- [ ] Ver resultados
- [ ] Responsividade em mobile
- [ ] Sem console errors
- [ ] Load time aceitável

---

## 🚀 Providers Recomendados

| Provider | Facilidade | Custo | Notas |
|----------|-----------|-------|-------|
| **Vercel** | ⭐⭐⭐⭐⭐ | Freemium | Otimizado para Next.js |
| **Render** | ⭐⭐⭐⭐ | $7+/mês | Suporta Docker |
| **Railway** | ⭐⭐⭐⭐ | $5+/mês | Simples e direto |
| **AWS** | ⭐⭐⭐ | Variável | Mais controle |
| **DigitalOcean** | ⭐⭐⭐⭐ | $6+/mês | Droplets ou App Platform |
| **Heroku** | ⭐⭐⭐⭐ | $7+/mês | Suporta Docker |

---

## 📝 Deploy Rápido (Vercel - Recomendado)

```bash
# 1. Instalar Vercel CLI
npm i -g vercel

# 2. Login
vercel login

# 3. Deploy
vercel --prod

# 4. Configurar variáveis no painel Vercel
# Settings → Environment Variables
```

**Ou conectar repositório GitHub direto no painel Vercel.**

---

## 🔧 Configurações Importantes no `next.config.ts`

```typescript
const nextConfig: NextConfig = {
  output: "standalone",  // ✓ Já configurado
  productionBrowserSourceMaps: false,  // Desabilitar source maps em produção
  swcMinify: true,  // Minificação via SWC
  compress: true,  // Gzip compression
  
  // Headers de segurança
  async headers() {
    return [{
      source: '/:path*',
      headers: [
        { key: 'X-DNS-Prefetch-Control', value: 'on' },
        { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
      ],
    }];
  },
  
  // Redirect HTTP → HTTPS em produção
  async redirects() {
    return [];
  },
};
```

---

## 🎯 Prioridade de Ações (MVP)

### 🔴 **CRÍTICO** - Fazer Agora
1. Configurar Supabase em produção
2. Definir SITE_URL corretamente
3. Colocar variáveis secretas de forma segura
4. Testear login e autenticação
5. Fazer deploy

### 🟡 **IMPORTANTE** - Fazer Antes de Usar
1. Configurar HTTPS/SSL
2. Configurar backups
3. Configurar monitoramento

### 🟢 **DESEJÁVEL** - Fazer Depois
1. CI/CD Pipeline
2. Performance optimization
3. Analytics

---

## 📚 Referências

- [Next.js Deploy Documentation](https://nextjs.org/docs/deployment)
- [Supabase Production Checklist](https://supabase.com/docs/guides/self-hosting)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [OWASP Security Checklist](https://owasp.org/www-project-web-security-testing-guide/)

---

## ❓ Próximas Questões

Se tiver dúvidas específicas, responda:

1. **Qual será seu provider de hosting?** (Vercel, Render, AWS, etc.)
2. **Já tem domínio registrado?**
3. **Qual é o volume de usuários esperado?**
4. **Precisa de email de confirmação/recuperação?**
5. **Vai usar CI/CD (GitHub Actions)?**

