# 👶 Sheltered Module

## 📋 Visão Geral

O módulo Sheltered gerencia as crianças abrigadas no sistema de orfanato, incluindo dados pessoais, informações dos responsáveis e vinculação com abrigos.

## 🏗️ Estrutura

### Entidades
- **ShelteredEntity** - Dados da criança abrigada
- **ShelterEntity** - Abrigo onde está (relacionamento)
- **AddressEntity** - Endereço da criança (relacionamento)

### Relacionamentos
```
Sheltered -> Shelter (N:1) - Uma criança pertence a um abrigo
Sheltered -> Address (1:1) - Uma criança tem um endereço
Shelter -> Sheltered (1:N) - Um abrigo pode ter múltiplas crianças
```

## 🚀 Endpoints

### 📋 Listagem e Busca
- `GET /sheltered` - Lista paginada com filtros
- `GET /sheltered/simple` - Lista simplificada
- `GET /sheltered/:id` - Busca por ID
- `GET /sheltered/by-shelter/:shelterId` - Crianças de um abrigo

### 🔧 Criação e Gerenciamento
- `POST /sheltered` - Criar nova criança abrigada
- `PATCH /sheltered/:id` - Atualizar dados
- `DELETE /sheltered/:id` - Deletar registro

## 📊 Filtros Disponíveis

### Query Parameters
- `page` - Número da página (padrão: 1)
- `limit` - Itens por página (padrão: 12, máximo: 100)
- `sort` - Campo de ordenação (`createdAt`, `updatedAt`, `name`, `age`)
- `order` - Direção (`asc`, `desc`)
- `searchString` - Busca por nome, documento ou responsável
- `shelterId` - Filtrar por ID do abrigo
- `ageMin` - Idade mínima
- `ageMax` - Idade máxima
- `hasGuardian` - Filtrar por crianças com responsável (`true`/`false`)

## 🔐 Autenticação e Autorização

### Roles Permitidos
- **admin** - Acesso total
- **coordinator** (leader) - Acesso às crianças dos seus abrigos
- **teacher** - Acesso às crianças dos abrigos onde trabalha

### Headers Obrigatórios
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

## 📝 Exemplos de Uso

### Listar Crianças com Paginação
```bash
GET /sheltered?page=1&limit=12&sort=name&order=asc
```

### Filtrar por Abrigo
```bash
GET /sheltered?shelterId=uuid-shelter-id
```

### Filtrar por Idade
```bash
GET /sheltered?ageMin=5&ageMax=12
```

### Filtrar por Responsável
```bash
GET /sheltered?hasGuardian=true
```

### Criar Nova Criança
```bash
POST /sheltered
Content-Type: application/json

{
  "name": "João Silva",
  "birthDate": "2015-03-15",
  "document": "12345678901",
  "shelterId": "uuid-shelter-id",
  "guardianName": "Maria Silva",
  "guardianPhone": "+5511999999999",
  "address": {
    "street": "Rua das Flores, 123",
    "district": "Centro",
    "city": "São Paulo",
    "state": "SP",
    "postalCode": "01234-567"
  }
}
```

### Atualizar Dados
```bash
PATCH /sheltered/uuid-sheltered-id
Content-Type: application/json

{
  "name": "João Silva Santos",
  "guardianPhone": "+5511888888888"
}
```

## 📊 Respostas da API

### Sucesso - Lista Paginada (200)
```json
{
  "items": [
    {
      "id": "uuid-sheltered",
      "name": "João Silva",
      "birthDate": "2015-03-15",
      "age": 8,
      "document": "12345678901",
      "guardianName": "Maria Silva",
      "guardianPhone": "+5511999999999",
      "shelter": {
        "id": "uuid-shelter",
        "name": "Abrigo Central",
        "time": "19:00"
      },
      "address": {
        "id": "uuid-address",
        "street": "Rua das Flores, 123",
        "district": "Centro",
        "city": "São Paulo",
        "state": "SP",
        "postalCode": "01234-567"
      },
      "createdAt": "2025-09-27T21:00:00.000Z",
      "updatedAt": "2025-09-27T21:00:00.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 12
}
```

### Sucesso - Criação (201)
```json
{
  "id": "uuid-sheltered",
  "name": "João Silva",
  "birthDate": "2015-03-15",
  "age": 8,
  "document": "12345678901",
  "guardianName": "Maria Silva",
  "guardianPhone": "+5511999999999",
  "shelter": {
    "id": "uuid-shelter",
    "name": "Abrigo Central",
    "time": "19:00"
  },
  "address": {
    "id": "uuid-address",
    "street": "Rua das Flores, 123",
    "district": "Centro",
    "city": "São Paulo",
    "state": "SP",
    "postalCode": "01234-567"
  },
  "createdAt": "2025-09-27T21:00:00.000Z",
  "updatedAt": "2025-09-27T21:00:00.000Z"
}
```

### Erro - Criança Não Encontrada (404)
```json
{
  "statusCode": 404,
  "message": "Sheltered não encontrado",
  "error": "Not Found"
}
```

### Erro - Abrigo Não Encontrado (404)
```json
{
  "statusCode": 404,
  "message": "Shelter não encontrado",
  "error": "Not Found"
}
```

### Erro - Validação (400)
```json
{
  "statusCode": 400,
  "message": [
    "name should not be empty",
    "birthDate must be a valid date",
    "document must be a valid CPF"
  ],
  "error": "Bad Request"
}
```

## 🔒 Segurança

### Validações de Documento
- Formato válido de CPF
- Único no sistema

### Validações de Data
- Data de nascimento válida
- Idade calculada automaticamente

### Validações de Responsável
- Nome do responsável (opcional)
- Telefone do responsável (opcional)

## 🧪 Testes

### Scripts Disponíveis
- `tests/sheltered/test-sheltered-crud.js` - Teste CRUD básico
- `tests/sheltered/test-sheltered-filters.js` - Teste de filtros
- `tests/sheltered/test-sheltered-shelter-linking.js` - Teste de vinculação

### Executar Testes
```bash
node tests/sheltered/test-sheltered-crud.js
node tests/sheltered/test-sheltered-filters.js
node tests/sheltered/test-sheltered-shelter-linking.js
```

## 🤖 Automações

### Scripts Disponíveis
- `automations/sheltered/create-sheltered-automation.js` - Criação em massa

### Executar Automação
```bash
node automations/sheltered/create-sheltered-automation.js
```

## 📁 Arquivos Relacionados

### Código Fonte
- `src/modules/sheltered/sheltered.controller.ts`
- `src/modules/sheltered/sheltered.service.ts`
- `src/modules/sheltered/sheltered.repository.ts`
- `src/modules/sheltered/sheltered.entity.ts`
- `src/modules/sheltered/dto/` - DTOs de request e response

### Documentação
- `docs/Sheltered_API_Collection.postman_collection.json`
- `docs/Sheltered_API_Documentation.md`

### Resultados de Automações
- `docs/sheltered/results/created-sheltered-2025-09-27.json` - Criação de crianças abrigadas

## 🔄 Histórico de Mudanças

### v1.2.0 - Campos Opcionais
- ✅ `guardianName` agora é opcional
- ✅ `guardianPhone` agora é opcional
- ✅ Validações atualizadas
- ✅ Collection do Postman atualizada

### v1.1.0 - Funcionalidades Básicas
- ✅ CRUD completo de crianças abrigadas
- ✅ Vinculação com abrigos
- ✅ Dados de responsáveis
- ✅ Paginação e filtros
- ✅ Autenticação e autorização

## 📋 Campos da Entidade

### ShelteredEntity
- `id` - UUID único
- `name` - Nome completo (obrigatório)
- `birthDate` - Data de nascimento (obrigatório)
- `age` - Idade calculada automaticamente
- `document` - CPF único (obrigatório)
- `guardianName` - Nome do responsável (opcional)
- `guardianPhone` - Telefone do responsável (opcional)
- `shelter` - Relacionamento com ShelterEntity
- `address` - Relacionamento com AddressEntity
- `createdAt` - Data de criação
- `updatedAt` - Data de atualização

## 🔧 Configuração

### Credenciais de Teste
```json
{
  "email": "joao@example.com",
  "password": "password123"
}
```

### Validações Especiais
- **CPF**: Formato brasileiro válido
- **Data de Nascimento**: Formato ISO (YYYY-MM-DD)
- **Idade**: Calculada automaticamente em anos

---

**Módulo Sheltered - Sistema de Orfanato** 👶
