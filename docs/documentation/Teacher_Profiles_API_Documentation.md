# Teacher Profiles API Documentation

## Visão Geral

O módulo Teacher Profiles gerencia os perfis dos professores no sistema, incluindo vinculação a shelters e controle de acesso baseado em roles.

## Autenticação

Todos os endpoints requerem autenticação JWT Bearer Token.

```http
Authorization: Bearer {{access_token}}
```

## Endpoints

### 1. Listar Teacher Profiles (Paginação)

**GET** `/teacher-profiles`

Lista todos os teacher profiles com paginação e filtros.

#### Query Parameters

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `page` | number | Não | Número da página (padrão: 1) |
| `limit` | number | Não | Itens por página (padrão: 12, máximo: 100) |
| `sort` | string | Não | Campo para ordenação (`name`, `createdAt`, `updatedAt`) |
| `order` | string | Não | Direção da ordenação (`asc`, `desc`) |
| `q` | string | Não | Termo de busca (nome, email, telefone) |
| `searchString` | string | Não | Termo de busca alternativo |
| `hasShelter` | boolean | Não | Filtrar por teachers com/sem shelter |
| `active` | boolean | Não | Filtrar por teachers ativos/inativos |

#### Exemplo de Resposta

```json
{
  "items": [
    {
      "id": "6ee8970b-ebbb-4bef-af5a-714683e24196",
      "active": true,
      "user": {
        "id": "f3d415c7-25e4-4ec3-abb9-4d439310b8a2",
        "name": "Teste Teacher",
        "email": "teste.teacher@example.com",
        "phone": "+5511999999999",
        "active": true,
        "completed": true,
        "commonUser": false
      },
      "shelter": {
        "id": "29369713-25c4-436f-8c9e-138b3560a175",
        "name": "Abrigo Barra da Tijuca 10",
        "leader": {
          "id": "abc123-def456-ghi789",
          "active": true,
          "user": {
            "id": "leader-user-id",
            "name": "João Silva",
            "email": "joao@example.com",
            "phone": "+5511987654321",
            "active": true,
            "completed": true,
            "commonUser": false
          }
        }
      },
      "createdAt": "2025-09-28T00:57:45.597Z",
      "updatedAt": "2025-09-28T00:57:45.597Z"
    }
  ],
  "total": 42,
  "page": 1,
  "limit": 12
}
```

### 2. Listar Teacher Profiles (Simples)

**GET** `/teacher-profiles/simple`

Lista teacher profiles de forma simplificada.

#### Exemplo de Resposta

```json
[
  {
    "id": "6ee8970b-ebbb-4bef-af5a-714683e24196",
    "active": true,
    "user": {
      "id": "f3d415c7-25e4-4ec3-abb9-4d439310b8a2",
      "name": "Teste Teacher",
      "email": "teste.teacher@example.com",
      "active": true
    },
    "shelter": {
      "id": "29369713-25c4-436f-8c9e-138b3560a175",
      "name": "Abrigo Barra da Tijuca 10"
    }
  }
]
```

### 3. Buscar Teacher Profile por ID

**GET** `/teacher-profiles/:id`

Busca um teacher profile específico por ID.

#### Path Parameters

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `id` | UUID | Sim | ID do teacher profile |

#### Exemplo de Resposta

```json
{
  "id": "6ee8970b-ebbb-4bef-af5a-714683e24196",
  "active": true,
  "user": {
    "id": "f3d415c7-25e4-4ec3-abb9-4d439310b8a2",
    "name": "Teste Teacher",
    "email": "teste.teacher@example.com",
    "phone": "+5511999999999",
    "active": true,
    "completed": true,
    "commonUser": false
  },
  "shelter": {
    "id": "29369713-25c4-436f-8c9e-138b3560a175",
    "name": "Abrigo Barra da Tijuca 10",
    "leader": {
      "id": "abc123-def456-ghi789",
      "active": true,
      "user": {
        "id": "leader-user-id",
        "name": "João Silva",
        "email": "joao@example.com",
        "phone": "+5511987654321",
        "active": true,
        "completed": true,
        "commonUser": false
      }
    }
  },
  "createdAt": "2025-09-28T00:57:45.597Z",
  "updatedAt": "2025-09-28T00:57:45.597Z"
}
```

### 4. Buscar Teachers por Shelter

**GET** `/teacher-profiles/by-shelter/:shelterId`

Busca todos os teachers vinculados a um shelter específico.

#### Path Parameters

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `shelterId` | UUID | Sim | ID do shelter |

#### Exemplo de Resposta

```json
[
  {
    "id": "6ee8970b-ebbb-4bef-af5a-714683e24196",
    "active": true,
    "user": {
      "id": "f3d415c7-25e4-4ec3-abb9-4d439310b8a2",
      "name": "Teste Teacher",
      "email": "teste.teacher@example.com",
      "phone": "+5511999999999",
      "active": true,
      "completed": true,
      "commonUser": false
    },
    "shelter": {
      "id": "29369713-25c4-436f-8c9e-138b3560a175",
      "name": "Abrigo Barra da Tijuca 10",
      "leader": {
        "id": "abc123-def456-ghi789",
        "active": true,
        "user": {
          "id": "leader-user-id",
          "name": "João Silva",
          "email": "joao@example.com",
          "phone": "+5511987654321",
          "active": true,
          "completed": true,
          "commonUser": false
        }
      }
    },
    "createdAt": "2025-09-28T00:57:45.597Z",
    "updatedAt": "2025-09-28T00:57:45.597Z"
  }
]
```

### 5. Vincular Teacher a Shelter

**PATCH** `/teacher-profiles/:teacherId/assign-shelter`

Vincula um teacher a um shelter específico.

#### Path Parameters

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `teacherId` | UUID | Sim | ID do teacher profile |

#### Request Body

```json
{
  "shelterId": "29369713-25c4-436f-8c9e-138b3560a175"
}
```

#### Exemplo de Resposta

```json
{
  "message": "Teacher atribuído ao shelter com sucesso"
}
```

### 6. Desvincular Teacher de Shelter

**PATCH** `/teacher-profiles/:teacherId/unassign-shelter`

Remove a vinculação de um teacher com um shelter.

#### Path Parameters

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `teacherId` | UUID | Sim | ID do teacher profile |

#### Request Body

```json
{
  "shelterId": "29369713-25c4-436f-8c9e-138b3560a175"
}
```

#### Exemplo de Resposta

```json
{
  "message": "Teacher removido do shelter com sucesso"
}
```

## Códigos de Status HTTP

| Código | Descrição |
|--------|-----------|
| 200 | Sucesso |
| 201 | Criado com sucesso |
| 400 | Dados inválidos |
| 401 | Não autorizado |
| 403 | Acesso negado |
| 404 | Recurso não encontrado |
| 500 | Erro interno do servidor |

## Exemplos de Uso

### Buscar Teachers com Shelter

```http
GET /teacher-profiles?hasShelter=true&active=true&page=1&limit=5
```

### Buscar Teachers sem Shelter

```http
GET /teacher-profiles?hasShelter=false&active=true
```

### Buscar por Termo

```http
GET /teacher-profiles?q=João&sort=name&order=asc
```

### Vincular Teacher a Shelter

```http
PATCH /teacher-profiles/6ee8970b-ebbb-4bef-af5a-714683e24196/assign-shelter
Content-Type: application/json

{
  "shelterId": "29369713-25c4-436f-8c9e-138b3560a175"
}
```

## Controle de Acesso

- **Admin**: Acesso total a todos os endpoints
- **Leader**: Pode ver apenas teachers dos seus shelters
- **Teacher**: Não tem acesso aos endpoints de listagem

## Relacionamentos

- **User**: Cada teacher profile está vinculado a um usuário
- **Shelter**: Teachers podem ser vinculados a shelters
- **Leader**: Cada shelter tem um leader responsável

## Validações

- Teacher profiles são criados automaticamente quando um usuário com role `teacher` é criado
- Um teacher só pode estar vinculado a um shelter por vez
- Apenas admins podem vincular/desvincular teachers de shelters
- Teachers inativos não aparecem nas listagens
