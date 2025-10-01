# 📚 Documentação da API - Sistema de Orfanato

## 🎯 Visão Geral

Esta documentação abrange todos os módulos do sistema de orfanato, incluindo endpoints, exemplos de uso, testes e automações.

## 📁 Estrutura da Documentação

### 📚 [Collections](collections/README.md)
**Collections do Postman**
- Collections organizadas por módulo
- Endpoints completos com exemplos
- Autenticação JWT configurada
- Variáveis de ambiente prontas

### 🌍 [Environments](environments/README.md)
**Ambientes Postman**
- Ambientes específicos por módulo
- Ambiente geral unificado
- Variáveis de teste configuradas
- Credenciais de admin incluídas

### 📖 [Documentation](documentation/README.md)
**Documentação Detalhada**
- Documentação completa da API
- Exemplos de uso detalhados
- Códigos de erro e tratamentos
- Guias de integração

### 📝 [Summaries](summaries/README.md)
**Resumos e Refatorações**
- Resumos de automações executadas
- Documentação de refatorações
- Estatísticas e métricas
- Logs de execução

## 📋 Módulos Disponíveis

### 🔐 [Auth Module](auth/README.md)
**Autenticação e Autorização**
- Registro e login de usuários
- JWT tokens e refresh tokens
- Controle de acesso por roles
- Validação de dados

**Endpoints Principais:**
- `POST /auth/register` - Registrar usuário
- `POST /auth/login` - Fazer login
- `POST /auth/refresh` - Renovar token
- `GET /auth/profile` - Obter perfil

### 👥 [Users Module](users/README.md)
**Gerenciamento de Usuários**
- CRUD completo de usuários
- Ativação/desativação
- Controle de roles
- Filtros e paginação

**Endpoints Principais:**
- `GET /users` - Listar usuários
- `POST /users` - Criar usuário
- `PATCH /users/:id` - Atualizar usuário
- `PATCH /users/:id/activate` - Ativar usuário

### 🏠 [Shelters Module](shelters/README.md)
**Gerenciamento de Abrigos**
- CRUD completo de abrigos
- Vinculação com endereços
- Relacionamento com líderes e professores
- Filtros por localização

**Endpoints Principais:**
- `GET /shelters` - Listar abrigos
- `POST /shelters` - Criar abrigo
- `PATCH /shelters/:id` - Atualizar abrigo
- `DELETE /shelters/:id` - Deletar abrigo

### 👶 [Sheltered Module](sheltered/README.md)
**Crianças Abrigadas**
- CRUD completo de crianças
- Dados pessoais e responsáveis
- Vinculação com abrigos
- Filtros por idade e localização

**Endpoints Principais:**
- `GET /sheltered` - Listar crianças
- `POST /sheltered` - Criar registro
- `PATCH /sheltered/:id` - Atualizar dados
- `GET /sheltered/by-shelter/:shelterId` - Crianças por abrigo

### 👨‍💼 [Leader Profiles Module](leader-profiles/README.md)
**Perfis de Líderes/Coordenadores**
- CRUD completo de perfis
- Vinculação com abrigos
- Gerenciamento de professores
- Movimentação de abrigos

**Endpoints Principais:**
- `GET /leader-profiles` - Listar líderes
- `POST /leader-profiles/create-for-user/:userId` - Criar perfil
- `PATCH /leader-profiles/:id/assign-shelter` - Vincular abrigo
- `PATCH /leader-profiles/:id/move-shelter` - Mover abrigo

### 👨‍🏫 [Teacher Profiles Module](teacher-profiles/README.md)
**Perfis de Professores**
- CRUD completo de perfis
- Vinculação com abrigos
- Atribuição de responsabilidades
- Filtros por abrigo

**Endpoints Principais:**
- `GET /teacher-profiles` - Listar professores
- `POST /teacher-profiles/create-for-user/:userId` - Criar perfil
- `PATCH /teacher-profiles/:id/assign-shelter` - Vincular abrigo
- `GET /teacher-profiles/by-shelter/:shelterId` - Professores por abrigo

## 🚀 Início Rápido

### 1. Configuração Inicial
```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env

# Executar migrações
npm run migration:run

# Iniciar aplicação
npm run start:dev
```

### 2. Credenciais de Teste
```json
{
  "email": "joao@example.com",
  "password": "password123"
}
```

### 3. Primeiros Passos
1. **Fazer login** com as credenciais de admin
2. **Criar usuários** usando o módulo Auth
3. **Criar abrigos** usando o módulo Shelters
4. **Criar perfis** usando Leader/Teacher Profiles
5. **Cadastrar crianças** usando o módulo Sheltered

## 📊 Postman Collections

Todas as collections estão disponíveis na pasta raiz `docs/`:

- `Auth_API_Collection.postman_collection.json`
- `User_API_Collection.postman_collection.json`
- `Shelters_API_Collection.postman_collection.json`
- `Sheltered_API_Collection.postman_collection.json`
- `Leader_Profiles_API_Collection.postman_collection.json`
- `Teacher_Profiles_API_Collection.postman_collection.json`

### Ambiente Postman
Use o arquivo `General_API_Environment.postman_environment.json` para configurar as variáveis de ambiente.

## 🧪 Testes e Automações

### Estrutura de Testes
```
tests/
├── auth/           # Testes de autenticação
├── users/          # Testes de usuários
├── shelters/       # Testes de abrigos
├── sheltered/      # Testes de crianças
├── leader-profiles/ # Testes de líderes
└── teacher-profiles/ # Testes de professores
```

### Estrutura de Automações
```
automations/
├── auth/           # Automações de autenticação
├── users/          # Automações de usuários
├── shelters/       # Automações de abrigos
├── sheltered/      # Automações de crianças
├── leader-profiles/ # Automações de líderes
└── teacher-profiles/ # Automações de professores
```

### Executar Testes
```bash
# Testes específicos por módulo
node tests/auth/test-login.js
node tests/users/test-user-crud.js
node tests/shelters/test-shelter-filters.js
```

### Executar Automações
```bash
# Automações de criação em massa
node automations/users/create-users-automation.js
node automations/shelters/create-shelters-automation.js
node automations/leader-profiles/create-leader-profiles-smart.js
node automations/teacher-profiles/create-teacher-profiles-automation.js
```

## 🔐 Autenticação e Autorização

### Roles do Sistema
- **admin** - Acesso total ao sistema
- **coordinator** (leader) - Gerencia abrigos e professores
- **teacher** - Acesso limitado aos próprios dados

### Headers Obrigatórios
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

### Fluxo de Autenticação
1. **Registro** - `POST /auth/register`
2. **Login** - `POST /auth/login`
3. **Uso da API** - Incluir token no header
4. **Renovação** - `POST /auth/refresh` (quando necessário)

## 📋 Convenções da API

### Paginação Padrão
- `page=1` - Primeira página
- `limit=12` - 12 itens por página (máximo: 100)

### Filtros Comuns
- `searchString` - Busca textual
- `active` - Status ativo (`true`/`false`)
- `sort` - Campo de ordenação
- `order` - Direção (`asc`/`desc`)

### Status Codes
- `200` - Sucesso
- `201` - Criado com sucesso
- `400` - Erro de validação
- `401` - Não autorizado
- `403` - Acesso negado
- `404` - Não encontrado
- `409` - Conflito (duplicação)
- `500` - Erro interno do servidor

## 🔧 Configuração

### Variáveis de Ambiente
```env
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=password
DATABASE_NAME=orfanato_db

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_SECRET=your-refresh-secret
REFRESH_TOKEN_EXPIRES_IN=30d

# Server
PORT=3000
NODE_ENV=development
```

### Credenciais de Teste
```json
{
  "admin": {
    "email": "joao@example.com",
    "password": "password123"
  }
}
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📞 Suporte

Para dúvidas ou suporte:
- Abra uma issue no GitHub
- Consulte a documentação específica de cada módulo
- Execute os testes para verificar funcionalidades

---

**Sistema de Orfanato - Documentação Completa** 🏠
