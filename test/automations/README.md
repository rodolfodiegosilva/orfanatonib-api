# 🎯 Automações dos Módulos do Sistema Orfanato

Este diretório contém automações completas para testar cada módulo específico do sistema Orfanato.

## 📋 Estrutura das Automações

### 🏠 **Shelters** - `shelters/shelters-complete-automation.js`
- ✅ CRUD completo de Shelters
- ✅ Filtros e buscas (nome, cidade, estado, capacidade)
- ✅ Listagens paginadas e simples
- ✅ Validações de dados
- ✅ Relacionamentos com Users/Profiles
- ✅ Estatísticas e relatórios

### 👥 **Sheltered** - `sheltered/sheltered-complete-automation.js`
- ✅ CRUD completo de Sheltered
- ✅ Filtros avançados (gender, nome, shelter, endereço)
- ✅ Busca geográfica inteligente
- ✅ Validação de gender (M/F)
- ✅ Relacionamentos com Shelters
- ✅ Filtros por data (nascimento, entrada)

### 👤 **Users** - `users/users-complete-automation.js`
- ✅ CRUD completo de Users
- ✅ Filtros por nome, email, role, status
- ✅ Autenticação e login
- ✅ Validação de roles (admin, leader, teacher)
- ✅ Estatísticas de users
- ✅ Validações de email e senha

### 📚 **Pagelas** - `pagelas/pagelas-complete-automation.js`
- ✅ CRUD completo de Pagelas
- ✅ Filtros por sheltered, título, data, conteúdo
- ✅ Relacionamentos com Sheltered
- ✅ Busca avançada e múltiplos critérios
- ✅ Estatísticas de pagelas
- ✅ Ordenação por data

### 👨‍💼 **Leader Profiles** - `leader-profiles/leader-profiles-complete-automation.js`
- ✅ CRUD completo de Leader Profiles
- ✅ Filtros por nome, shelter, email, cidade
- ✅ Relacionamentos com Users e Shelters
- ✅ Validações de dados
- ✅ Listagens e paginação

### 👩‍🏫 **Teacher Profiles** - `teacher-profiles/teacher-profiles-complete-automation.js`
- ✅ CRUD completo de Teacher Profiles
- ✅ Filtros por nome, shelter, especialização, experiência
- ✅ Relacionamentos com Users e Shelters
- ✅ Testes de especializações (Matemática, Português, etc.)
- ✅ Validações de dados


## 🚀 Como Executar

### Pré-requisitos
- Servidor da API rodando em `http://localhost:3000`
- Banco de dados configurado
- Usuário admin criado (`joao@example.com` / `password123`)

### Executar Automação Individual
```bash
# Testar módulo Sheltered
node automations/sheltered/sheltered-complete-automation.js

# Testar módulo Shelters
node automations/shelters/shelters-complete-automation.js

# Testar módulo Users
node automations/users/users-complete-automation.js

# Testar módulo Pagelas
node automations/pagelas/pagelas-complete-automation.js

# Testar módulo Leader Profiles
node automations/leader-profiles/leader-profiles-complete-automation.js

# Testar módulo Teacher Profiles
node automations/teacher-profiles/teacher-profiles-complete-automation.js
```


## 📊 O que Cada Automação Testa

### ✅ **Funcionalidades Testadas**
1. **CRUD Completo** - Criar, buscar, atualizar, deletar
2. **Filtros e Buscas** - Todos os tipos de filtro disponíveis
3. **Listagens** - Paginadas, simples, ordenação
4. **Validações** - Dados inválidos, campos obrigatórios
5. **Relacionamentos** - Vinculações entre entidades
6. **Autenticação** - Login, roles, permissões
7. **Estatísticas** - Contadores, relatórios

### ✅ **Validações Especiais**
- **Gender**: Apenas "M" ou "F" são aceitos
- **Email**: Formato válido e único
- **Senha**: Mínimo de caracteres
- **Roles**: admin, leader, teacher
- **Datas**: Formato ISO válido
- **UUIDs**: Identificadores válidos

## 🎯 Resultados Esperados

Cada automação deve:
- ✅ Fazer login com sucesso
- ✅ Obter dados necessários
- ✅ Executar todos os testes CRUD
- ✅ Testar filtros e buscas
- ✅ Validar dados corretamente
- ✅ Testar relacionamentos
- ✅ Mostrar estatísticas
- ✅ Finalizar com sucesso

## 📝 Logs e Debugging

As automações fornecem logs detalhados:
- 🔐 Status de login
- 📊 Dados obtidos
- ✅ Sucessos dos testes
- ❌ Erros encontrados
- 📈 Estatísticas finais

## 🔧 Configuração

Para personalizar as automações, edite:
- `BASE_URL`: URL da API
- `ADMIN_CREDENTIALS`: Credenciais de admin
- Parâmetros de teste (nomes, emails, etc.)

## 📁 Arquivos de Resultado

Alguns testes geram arquivos JSON com resultados:
- `created-shelters-*.json`
- `created-leader-profiles-*.json`
- Resultados em `docs/results/`

---

**🎉 Todas as automações estão prontas para uso e testam completamente cada módulo do sistema!**