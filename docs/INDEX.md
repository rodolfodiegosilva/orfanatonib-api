# 📚 Documentação Completa - Sistema de Orfanato

## 🎯 Visão Geral

Este repositório contém um sistema completo de gerenciamento de orfanato desenvolvido com NestJS, incluindo documentação detalhada, testes automatizados e scripts de automação.

## 📁 Estrutura do Projeto

```
orfanatonib-api/
├── 📚 docs/                    # Documentação completa
│   ├── auth/                   # Módulo de autenticação
│   ├── users/                  # Módulo de usuários
│   ├── shelters/               # Módulo de abrigos
│   ├── sheltered/              # Módulo de crianças abrigadas
│   ├── leader-profiles/        # Módulo de perfis de líderes
│   ├── teacher-profiles/       # Módulo de perfis de professores
│   ├── *_API_Collection.postman_collection.json
│   ├── *_API_Documentation.md
│   └── README.md
├── 🧪 tests/                   # Scripts de teste
│   ├── auth/                   # Testes de autenticação
│   ├── users/                  # Testes de usuários
│   ├── shelters/               # Testes de abrigos
│   ├── sheltered/              # Testes de crianças
│   ├── leader-profiles/        # Testes de líderes
│   ├── teacher-profiles/       # Testes de professores
│   └── README.md
├── 🤖 automations/             # Scripts de automação
│   ├── auth/                   # Automações de autenticação
│   ├── users/                  # Automações de usuários
│   ├── shelters/               # Automações de abrigos
│   ├── sheltered/              # Automações de crianças
│   ├── leader-profiles/        # Automações de líderes
│   ├── teacher-profiles/       # Automações de professores
│   └── README.md
└── src/                        # Código fonte da aplicação
```

## 🚀 Início Rápido

### 1. Instalação
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

### 3. Executar Automações
```bash
# Criar perfis de líderes
node automations/leader-profiles/create-leader-profiles-smart.js

# Criar perfis de professores
node automations/teacher-profiles/create-teacher-profiles-automation.js
```

### 4. Executar Testes
```bash
# Testar vinculação de líderes
node tests/leader-profiles/test-shelter-linking.js

# Testar vinculação de professores
node tests/teacher-profiles/test-teacher-shelter-linking.js
```

## 📖 Documentação por Módulo

### 🔐 [Auth Module](docs/auth/README.md)
- Autenticação JWT
- Registro e login
- Refresh tokens
- Controle de acesso

### 👥 [Users Module](docs/users/README.md)
- Gerenciamento de usuários
- Roles e permissões
- Ativação/desativação
- Filtros e paginação

### 🏠 [Shelters Module](docs/shelters/README.md)
- CRUD de abrigos
- Vinculação com endereços
- Relacionamento com líderes
- Filtros por localização

### 👶 [Sheltered Module](docs/sheltered/README.md)
- Crianças abrigadas
- Dados pessoais e responsáveis
- Vinculação com abrigos
- Filtros por idade

### 👨‍💼 [Leader Profiles Module](docs/leader-profiles/README.md)
- Perfis de líderes
- Vinculação com abrigos
- Gerenciamento de professores
- Movimentação de abrigos

### 👨‍🏫 [Teacher Profiles Module](docs/teacher-profiles/README.md)
- Perfis de professores
- Vinculação com abrigos
- Atribuição de responsabilidades
- Filtros por abrigo

## 🧪 Testes Disponíveis

### Leader Profiles
- ✅ **Vinculação Shelter-Leader** - Testa assign/unassign
- ✅ **Movimentação de Abrigos** - Testa transferência
- ✅ **Validação de Permissões** - Testa controle de acesso

### Teacher Profiles
- ✅ **Vinculação Shelter-Teacher** - Testa assign/unassign
- ✅ **Validação de Permissões** - Testa controle de acesso
- ✅ **Filtros por Abrigo** - Testa busca por abrigo

## 🤖 Automações Disponíveis

### Leader Profiles
- ✅ **Criação Inteligente** - Cria perfis para usuários existentes
- ✅ **Validação de Dados** - Verifica dados necessários
- ✅ **Logs Detalhados** - Relatórios de execução

### Teacher Profiles
- ✅ **Criação em Massa** - Cria perfis para usuários existentes
- ✅ **Validação de Dados** - Verifica dados necessários
- ✅ **Logs Detalhados** - Relatórios de execução

## 📊 Postman Collections

Todas as collections estão disponíveis na pasta `docs/`:

- `Auth_API_Collection.postman_collection.json`
- `User_API_Collection.postman_collection.json`
- `Shelters_API_Collection.postman_collection.json`
- `Sheltered_API_Collection.postman_collection.json`
- `Leader_Profiles_API_Collection.postman_collection.json`
- `Teacher_Profiles_API_Collection.postman_collection.json`

### Ambiente Postman
Use o arquivo `General_API_Environment.postman_environment.json` para configurar as variáveis de ambiente.

## 🔐 Autenticação e Autorização

### Roles do Sistema
- **admin** - Acesso total ao sistema
- **coordinator** (leader) - Gerencia abrigos e professores
- **teacher** - Acesso limitado aos próprios dados

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

## 🎯 Funcionalidades Principais

### ✅ Implementadas
- Autenticação JWT completa
- CRUD de todos os módulos
- Paginação e filtros
- Vinculação entre entidades
- Controle de acesso por roles
- Validação de dados
- Testes automatizados
- Scripts de automação
- Documentação completa
- Collections do Postman

### 🔄 Em Desenvolvimento
- Relatórios avançados
- Notificações
- Upload de arquivos
- Integração com SMS
- Dashboard administrativo

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📞 Suporte

Para dúvidas ou suporte:
- Consulte a documentação específica de cada módulo
- Execute os testes para verificar funcionalidades
- Abra uma issue no GitHub

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

---

**Sistema de Orfanato - Documentação Completa** 🏠

**Desenvolvido com ❤️ para o sistema de orfanato**
