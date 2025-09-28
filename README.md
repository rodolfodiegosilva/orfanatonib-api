# 🏠 Orfanato API - Documentação Completa

## 📋 Visão Geral

Esta API foi desenvolvida para gerenciar um sistema completo de orfanato, incluindo usuários, abrigos (shelters), crianças abrigadas (sheltered), perfis de líderes e professores.

## 🏗️ Arquitetura

### Módulos Principais
- **Auth** - Autenticação e autorização
- **Users** - Gerenciamento de usuários
- **Shelters** - Gerenciamento de abrigos
- **Sheltered** - Crianças abrigadas
- **Leader Profiles** - Perfis de líderes/coordenadores
- **Teacher Profiles** - Perfis de professores

## 📁 Estrutura do Projeto

```
orfanatonib-api/
├── 📚 docs/                    # Documentação completa
│   ├── auth/                   # Documentação do módulo Auth
│   ├── users/                   # Documentação do módulo Users
│   ├── shelters/               # Documentação do módulo Shelters
│   ├── sheltered/              # Documentação do módulo Sheltered
│   ├── leader-profiles/        # Documentação do módulo Leader Profiles
│   ├── teacher-profiles/       # Documentação do módulo Teacher Profiles
│   ├── *_API_Collection.postman_collection.json
│   ├── *_API_Documentation.md
│   ├── *_API_Environment.postman_environment.json
│   └── *_Usage_Examples.md
├── 🧪 tests/                   # Scripts de teste
│   ├── auth/                   # Testes do módulo Auth
│   ├── users/                  # Testes do módulo Users
│   ├── shelters/               # Testes do módulo Shelters
│   ├── sheltered/              # Testes do módulo Sheltered
│   ├── leader-profiles/        # Testes do módulo Leader Profiles
│   └── teacher-profiles/       # Testes do módulo Teacher Profiles
├── 🤖 automations/             # Scripts de automação
│   ├── auth/                   # Automações do módulo Auth
│   ├── users/                  # Automações do módulo Users
│   ├── shelters/               # Automações do módulo Shelters
│   ├── sheltered/              # Automações do módulo Sheltered
│   ├── leader-profiles/        # Automações do módulo Leader Profiles
│   └── teacher-profiles/       # Automações do módulo Teacher Profiles
└── src/                        # Código fonte da aplicação
```

## 🚀 Início Rápido

### Pré-requisitos
- Node.js 18+
- PostgreSQL
- npm ou yarn

### Instalação
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

### Credenciais de Teste
```json
{
  "email": "joao@example.com",
  "password": "password123"
}
```

## 📖 Documentação por Módulo

### 🔐 [Auth Module](docs/auth/README.md)
- Autenticação JWT
- Registro de usuários
- Login/Logout
- Refresh tokens

### 👥 [Users Module](docs/users/README.md)
- Gerenciamento de usuários
- Perfis e roles
- Ativação/Desativação

### 🏠 [Shelters Module](docs/shelters/README.md)
- CRUD de abrigos
- Vinculação com líderes
- Paginação e filtros

### 👶 [Sheltered Module](docs/sheltered/README.md)
- Crianças abrigadas
- Vinculação com abrigos
- Dados pessoais e responsáveis

### 👨‍💼 [Leader Profiles Module](docs/leader-profiles/README.md)
- Perfis de líderes
- Vinculação com abrigos
- Gerenciamento de professores

### 👨‍🏫 [Teacher Profiles Module](docs/teacher-profiles/README.md)
- Perfis de professores
- Vinculação com abrigos
- Atribuição de responsabilidades

## 🧪 Testes

### Executar Testes
```bash
# Testes unitários
npm run test

# Testes e2e
npm run test:e2e

# Scripts de teste específicos
node tests/[module]/[test-file].js
```

### Automações Disponíveis
```bash
# Criar usuários em massa
node automations/users/create-users-automation.js

# Criar abrigos
node automations/shelters/create-shelters-automation.js

# Criar perfis de líderes
node automations/leader-profiles/create-leader-profiles-smart.js

# Criar perfis de professores
node automations/teacher-profiles/create-teacher-profiles-automation.js
```

### Resultados de Automações
Os resultados das execuções são salvos na documentação de cada módulo:
- `docs/[module]/results/created-*-YYYY-MM-DD.json` - Arquivos de resultado das automações
- Contém dados criados, estatísticas e logs de execução
- Útil para auditoria e análise de dados por módulo

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

## 🔧 Tecnologias Utilizadas

- **Backend:** NestJS, TypeScript
- **Database:** PostgreSQL, TypeORM
- **Auth:** JWT, Passport
- **Validation:** class-validator, class-transformer
- **Testing:** Jest, Supertest
- **Documentation:** Postman Collections

## 📝 Convenções

### Roles de Usuário
- `admin` - Acesso total ao sistema
- `coordinator` (leader) - Gerencia abrigos e professores
- `teacher` - Acesso limitado aos seus dados

### Padrões de API
- RESTful endpoints
- Paginação padrão: `page=1&limit=12`
- Filtros por query parameters
- Respostas padronizadas com status codes HTTP

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 📞 Suporte

Para dúvidas ou suporte, entre em contato através dos issues do GitHub.

---

**Desenvolvido com ❤️ para o sistema de orfanato**