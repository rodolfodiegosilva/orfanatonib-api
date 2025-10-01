# 👨‍🏫 Teacher Profiles Module

## 📋 Visão Geral

O módulo Teacher Profiles gerencia os perfis dos professores do sistema de orfanato, incluindo vinculação com abrigos e gerenciamento de responsabilidades.

## 🏗️ Estrutura

### Entidades
- **TeacherProfileEntity** - Perfil do professor
- **User** - Dados do usuário (relacionamento)
- **Shelter** - Abrigo vinculado (relacionamento)

### Relacionamentos
```
TeacherProfile -> User (1:1)
TeacherProfile -> Shelter (N:1)
Shelter -> LeaderProfile (1:1)
```

## 🚀 Endpoints

### 📋 Listagem e Busca
- `GET /teacher-profiles` - Lista paginada com filtros
- `GET /teacher-profiles/simple` - Lista simplificada
- `GET /teacher-profiles/:id` - Busca por ID
- `GET /teacher-profiles/by-shelter/:shelterId` - Teachers de um abrigo

### 🔧 Criação e Gerenciamento
- `POST /teacher-profiles/create-for-user/:userId` - Criar perfil para usuário
- `PATCH /teacher-profiles/:teacherId/assign-shelter` - Vincular a abrigo
- `PATCH /teacher-profiles/:teacherId/unassign-shelter` - Desvincular de abrigo

## 📊 Filtros Disponíveis

### Query Parameters
- `page` - Número da página (padrão: 1)
- `limit` - Itens por página (padrão: 12, máximo: 100)
- `sort` - Campo de ordenação (`updatedAt`, `createdAt`, `name`)
- `order` - Direção (`asc`, `desc`)
- `searchString` - Busca por nome, email ou telefone
- `active` - Filtrar por status ativo (`true`/`false`)
- `hasShelter` - Filtrar por teachers com abrigos (`true`/`false`)
- `shelterId` - Filtrar por ID específico do abrigo

## 🔐 Autenticação e Autorização

### Roles Permitidos
- **admin** - Acesso total
- **coordinator** (leader) - Acesso aos teachers dos seus abrigos
- **teacher** - Acesso apenas aos próprios dados

### Headers Obrigatórios
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

## 📝 Exemplos de Uso

### Listar Teachers com Paginação
```bash
GET /teacher-profiles?page=1&limit=12&sort=name&order=asc
```

### Filtrar Teachers por Abrigo
```bash
GET /teacher-profiles?shelterId=uuid-shelter-id&hasShelter=true
```

### Vincular Teacher a Abrigo
```bash
PATCH /teacher-profiles/uuid-teacher-id/assign-shelter
Content-Type: application/json

{
  "shelterId": "uuid-shelter-id"
}
```

### Desvincular Teacher de Abrigo
```bash
PATCH /teacher-profiles/uuid-teacher-id/unassign-shelter
Content-Type: application/json

{
  "shelterId": "uuid-shelter-id"
}
```

## 📊 Respostas da API

### Sucesso - Lista Paginada (200)
```json
{
  "items": [
    {
      "id": "uuid-teacher-profile",
      "active": true,
      "user": {
        "id": "uuid-user",
        "name": "João Silva",
        "email": "joao@example.com",
        "phone": "+5511999999999",
        "active": true,
        "completed": true,
        "commonUser": false
      },
      "shelter": {
        "id": "uuid-shelter",
        "name": "Abrigo Central",
        "time": "19:00",
        "leader": {
          "id": "uuid-leader",
          "user": {
            "id": "uuid-leader-user",
            "name": "Maria Santos",
            "email": "maria@example.com",
            "phone": "+5511888888888",
            "active": true,
            "completed": true,
            "commonUser": false
          }
        }
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

### Sucesso - Vinculação (200)
```json
{
  "message": "Teacher atribuído ao shelter com sucesso"
}
```

### Erro - Teacher Não Encontrado (404)
```json
{
  "statusCode": 404,
  "message": "TeacherProfile não encontrado",
  "error": "Not Found"
}
```

### Erro - Teacher Já Vinculado (400)
```json
{
  "statusCode": 400,
  "message": "Teacher já está vinculado a outro Shelter",
  "error": "Bad Request"
}
```

## 🧪 Testes

### Scripts Disponíveis
- `tests/teacher-profiles/test-teacher-shelter-linking.js` - Teste de vinculação

### Executar Testes
```bash
node tests/teacher-profiles/test-teacher-shelter-linking.js
```

## 🤖 Automações

### Scripts Disponíveis
- `automations/teacher-profiles/create-teacher-profiles-automation.js` - Criação em massa

### Executar Automação
```bash
node automations/teacher-profiles/create-teacher-profiles-automation.js
```

## 📁 Arquivos Relacionados

### Código Fonte
- `src/modules/teacher-profiles/controller/teacher-profiles.controller.ts`
- `src/modules/teacher-profiles/services/teacher-profiles.service.ts`
- `src/modules/teacher-profiles/repositories/teacher-profiles.repository.ts`
- `src/modules/teacher-profiles/dto/` - DTOs de request e response
- `src/modules/teacher-profiles/entities/teacher-profile.entity.ts`

### Documentação
- `docs/Teacher_Profiles_API_Collection.postman_collection.json`
- `docs/Teacher_Profiles_API_Documentation.md`

## 🔄 Histórico de Mudanças

### v1.2.0 - Refatoração para Shelters
- ✅ Renomeado `club` para `shelter` em todos os endpoints
- ✅ Atualizado `clubId` para `shelterId` nos DTOs
- ✅ Corrigido relacionamentos no repository
- ✅ Atualizada collection do Postman

### v1.1.0 - Funcionalidades Básicas
- ✅ CRUD completo de teacher profiles
- ✅ Vinculação com abrigos
- ✅ Paginação e filtros
- ✅ Autenticação e autorização

---

**Módulo Teacher Profiles - Sistema de Orfanato** 🏠
