# 👨‍💼 Leader Profiles Module

## 📋 Visão Geral

O módulo Leader Profiles gerencia os perfis dos líderes/coordenadores do sistema de orfanato, incluindo vinculação com abrigos e gerenciamento de professores.

## 🏗️ Estrutura

### Entidades
- **LeaderProfileEntity** - Perfil do líder
- **User** - Dados do usuário (relacionamento)
- **Shelter** - Abrigos vinculados (relacionamento N:N)

### Relacionamentos
```
LeaderProfile -> User (1:1)
LeaderProfile -> Shelter (N:N) - Um líder pode gerenciar múltiplos abrigos
Shelter -> LeaderProfile (1:1) - Um abrigo tem um líder principal
```

## 🚀 Endpoints

### 📋 Listagem e Busca
- `GET /leader-profiles` - Lista paginada com filtros
- `GET /leader-profiles/simple` - Lista simplificada
- `GET /leader-profiles/:id` - Busca por ID
- `GET /leader-profiles/by-shelter/:shelterId` - Líderes de um abrigo

### 🔧 Criação e Gerenciamento
- `POST /leader-profiles/create-for-user/:userId` - Criar perfil para usuário
- `PATCH /leader-profiles/:leaderId/assign-shelter` - Vincular a abrigo
- `PATCH /leader-profiles/:leaderId/unassign-shelter` - Desvincular de abrigo
- `PATCH /leader-profiles/:leaderId/move-shelter` - Mover abrigo entre líderes

## 📊 Filtros Disponíveis

### Query Parameters
- `page` - Número da página (padrão: 1)
- `limit` - Itens por página (padrão: 12, máximo: 100)
- `sort` - Campo de ordenação (`updatedAt`, `createdAt`, `name`)
- `order` - Direção (`asc`, `desc`)
- `searchString` - Busca por nome, email ou telefone
- `active` - Filtrar por status ativo (`true`/`false`)
- `hasShelter` - Filtrar por líderes com abrigos (`true`/`false`)
- `shelterId` - Filtrar por ID específico do abrigo

## 🔐 Autenticação e Autorização

### Roles Permitidos
- **admin** - Acesso total
- **coordinator** (leader) - Acesso aos próprios dados e abrigos
- **teacher** - Sem acesso

### Headers Obrigatórios
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

## 📝 Exemplos de Uso

### Listar Leaders com Paginação
```bash
GET /leader-profiles?page=1&limit=12&sort=name&order=asc
```

### Filtrar Leaders por Abrigo
```bash
GET /leader-profiles?shelterId=uuid-shelter-id&hasShelter=true
```

### Vincular Leader a Abrigo
```bash
PATCH /leader-profiles/uuid-leader-id/assign-shelter
Content-Type: application/json

{
  "shelterId": "uuid-shelter-id"
}
```

### Desvincular Leader de Abrigo
```bash
PATCH /leader-profiles/uuid-leader-id/unassign-shelter
Content-Type: application/json

{
  "shelterId": "uuid-shelter-id"
}
```

### Mover Abrigo entre Leaders
```bash
PATCH /leader-profiles/uuid-leader-id/move-shelter
Content-Type: application/json

{
  "shelterId": "uuid-shelter-id",
  "newLeaderId": "uuid-new-leader-id"
}
```

## 📊 Respostas da API

### Sucesso - Lista Paginada (200)
```json
{
  "items": [
    {
      "id": "uuid-leader-profile",
      "active": true,
      "user": {
        "id": "uuid-user",
        "name": "Maria Santos",
        "email": "maria@example.com",
        "phone": "+5511888888888",
        "active": true,
        "completed": true,
        "commonUser": false
      },
      "shelters": [
        {
          "id": "uuid-shelter",
          "name": "Abrigo Central",
          "time": "19:00"
        }
      ],
      "createdAt": "2025-09-27T21:00:00.000Z",
      "updatedAt": "2025-09-27T21:00:00.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 12
}
```

### Sucesso - Vinculação (200)
```json
{
  "message": "Líder atribuído ao shelter com sucesso"
}
```

### Sucesso - Movimentação (200)
```json
{
  "message": "Shelter movido com sucesso"
}
```

### Erro - Leader Não Encontrado (404)
```json
{
  "statusCode": 404,
  "message": "LeaderProfile não encontrado",
  "error": "Not Found"
}
```

### Erro - Shelter Não Encontrado (404)
```json
{
  "statusCode": 404,
  "message": "Shelter não encontrado",
  "error": "Not Found"
}
```

## 🧪 Testes

### Scripts Disponíveis
- `tests/leader-profiles/test-shelter-linking.js` - Teste de vinculação

### Executar Testes
```bash
node tests/leader-profiles/test-shelter-linking.js
```

## 🤖 Automações

### Scripts Disponíveis
- `automations/leader-profiles/create-leader-profiles-smart.js` - Criação em massa

### Executar Automação
```bash
node automations/leader-profiles/create-leader-profiles-smart.js
```

## 📁 Arquivos Relacionados

### Código Fonte
- `src/modules/leader-profiles/controller/leader-profiles.controller.ts`
- `src/modules/leader-profiles/services/leader-profiles.service.ts`
- `src/modules/leader-profiles/repositories/leader-profiles.repository.ts`
- `src/modules/leader-profiles/dto/` - DTOs de request e response
- `src/modules/leader-profiles/entities/leader-profile.entity.ts`

### Documentação
- `docs/Leader_Profiles_API_Collection.postman_collection.json`
- `docs/Leader_Profiles_API_Documentation.md`

### Resultados de Automações
- `docs/leader-profiles/results/created-leader-profiles-2025-09-27.json` - Criação de perfis de líderes
- `docs/leader-profiles/results/created-leaders-alternative-2025-09-27.json` - Criação alternativa de líderes
- `docs/leader-profiles/results/created-leaders-register-2025-09-27.json` - Registro de líderes

## 🔄 Histórico de Mudanças

### v1.2.0 - Refatoração para Shelters
- ✅ Renomeado `club` para `shelter` em todos os endpoints
- ✅ Atualizado `clubNumber` para `shelterId` nos filtros
- ✅ Corrigido relacionamentos no repository
- ✅ Atualizada collection do Postman com exemplos completos

### v1.1.0 - Funcionalidades Básicas
- ✅ CRUD completo de leader profiles
- ✅ Vinculação com abrigos
- ✅ Movimentação de abrigos entre líderes
- ✅ Paginação e filtros
- ✅ Autenticação e autorização

---

**Módulo Leader Profiles - Sistema de Orfanato** 🏠
