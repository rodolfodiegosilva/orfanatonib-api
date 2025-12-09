# 🏠 Módulo Abrigo - Guia Completo para Frontend

## 📋 Índice

1. [Visão Geral](#-visão-geral)
2. [Estrutura de Dados](#-estrutura-de-dados)
3. [Endpoints Detalhados](#-endpoints-detalhados)
4. [DTOs de Entrada e Saída](#-dtos-de-entrada-e-saída)
5. [Dicas de Implementação](#-dicas-de-implementação)
6. [Fluxos de Trabalho Comuns](#-fluxos-de-trabalho-comuns)
7. [Regras e Validações](#-regras-e-validações)

---

## 📋 Visão Geral

O módulo de **Abrigo** é responsável por gerenciar todos os abrigos do sistema. Cada abrigo pode ter múltiplas equipes, e cada equipe pode ter múltiplos líderes e professores.

### 🎯 Conceitos Principais

- **Abrigo (Shelter)**: Unidade física que abriga pessoas
- **Equipe (Team)**: Grupo de trabalho dentro de um abrigo, identificado por um **número** (1, 2, 3, 4...)
- **Líder (Leader)**: Coordenador que pertence a uma equipe
- **Professor (Teacher)**: Educador que pertence a uma equipe
- **Abrigado (Sheltered)**: Pessoa que está no abrigo (relacionamento direto, não passa por equipes)

### 🏗️ Estrutura de Relacionamentos

```
┌─────────────┐
│   SHELTER   │ (Abrigo)
│  (Abrigo)   │
└──────┬──────┘
       │
       ├──────────────────────────┬──────────────────────────┐
       │                          │                          │
       │ 1:N (OneToMany)          │ 1:N (OneToMany)          │ 1:N (OneToMany)
       │                          │                          │
       ▼                          ▼                          ▼
┌─────────────┐            ┌─────────────┐            ┌─────────────┐
│    TEAM     │            │  SHELTERED  │            │  SHELTERED  │
│  (Equipe)   │            │  (Abrigado) │            │  (Abrigado) │
└──────┬──────┘            └─────────────┘            └─────────────┘
       │
       ├──────────────┬──────────────┐
       │              │              │
       │ 1:N          │ 1:N          │
       │              │              │
       ▼              ▼
┌─────────────┐  ┌─────────────┐
│   LEADER    │  │  TEACHER    │
│   PROFILE   │  │   PROFILE   │
└─────────────┘  └─────────────┘
```

**Fluxo de Relacionamentos:**
- **Abrigo → Equipe → Líder/Professor** (relacionamento através de equipes)
- **Abrigo → Abrigado** (relacionamento direto, SEM passar por equipes)

### 📌 Regras Importantes

1. **Equipes:**
   - Um abrigo pode ter **múltiplas equipes** (entidade Team)
   - Cada equipe pertence a **1 abrigo** (obrigatório)
   - Uma equipe pode ter **múltiplos líderes** e **múltiplos professores**
   - A equipe é identificada por um **número** (1, 2, 3, 4...), não por um nome descritivo
   - O campo `numberTeam` é do tipo **number** (não string)

2. **Líderes e Professores:**
   - ⭐ **Líderes podem pertencer a MÚLTIPLAS equipes** (ManyToMany) - podem estar em equipes do mesmo abrigo ou de abrigos diferentes
   - **Professores podem pertencer a apenas 1 equipe** (ou nenhuma) - ManyToOne
   - **NÃO têm relacionamento direto** com abrigos - sempre através de equipes
   - Para adicionar um líder/professor a um abrigo, você deve adicioná-lo a uma equipe do abrigo

3. **Abrigados:**
   - ⭐ **Abrigados (Sheltered) têm relacionamento DIRETO com Abrigo** - NÃO passam por equipes
   - Um abrigado pode estar em apenas 1 abrigo

4. **Atributos do Abrigo:**
   - `teamsQuantity` (number): Quantidade de equipes que o abrigo possui - **obrigatório** nos DTOs de criação e atualização
   - Este campo é opcional no banco de dados (para não quebrar dados existentes), mas obrigatório nos DTOs
   - ⭐ O campo `teamsQuantity` é usado como referência ao editar professores e líderes

5. **Respostas da API:**
   - ⚠️ Todos os endpoints de listagem (`GET /shelters`, `GET /shelters/simple`, `GET /shelters/:id`) retornam as equipes de cada abrigo, incluindo os líderes e professores de cada equipe
   - As equipes são sempre incluídas nas respostas
   - Os campos `leaders` e `teachers` na raiz do objeto são calculados automaticamente agregando todos os membros de todas as equipes (para compatibilidade)

---

## 📊 Estrutura de Dados

### Tipo: ShelterResponseDto

```typescript
interface ShelterResponseDto {
  id: string;                    // UUID do abrigo
  name: string;                  // Nome do abrigo
  description?: string;          // Descrição do abrigo
  teamsQuantity?: number;        // Quantidade de equipes do abrigo (number)
  address: AddressDto;           // Endereço completo
  teams: TeamWithMembersDto[];   // Array de equipes do abrigo
  leaders: CoordinatorDto[];     // TODOS os líderes (agregado de todas as equipes)
  teachers: TeacherDto[];        // TODOS os professores (agregado de todas as equipes)
  mediaItem?: MediaItemDto | null; // Imagem do abrigo
  createdAt: Date;
  updatedAt: Date;
}

interface TeamWithMembersDto {
  id: string;                    // UUID da equipe
  numberTeam: number;            // ⭐ NÚMERO da equipe (1, 2, 3, 4...) - tipo NUMBER
  description?: string;          // Descrição da equipe
  leaders: CoordinatorDto[];     // Líderes desta equipe
  teachers: TeacherDto[];        // Professores desta equipe
}

interface CoordinatorDto {
  id: string;                    // UUID do perfil do líder
  active: boolean;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
    active: boolean;
    completed: boolean;
    commonUser: boolean;
  };
}

interface TeacherDto {
  id: string;                    // UUID do perfil do professor
  active: boolean;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
    active: boolean;
    completed: boolean;
    commonUser: boolean;
  };
}

interface AddressDto {
  id: string;
    street: string;
  number?: string;
  district: string;
    city: string;
    state: string;
  postalCode: string;
  complement?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface MediaItemDto {
  id: string;
  title: string;
  description: string;
  mediaType: 'IMAGE';
  uploadType: 'UPLOAD' | 'LINK';
  url: string;
  isLocalFile: boolean;
  // ... outros campos
}
```

### Tipo: CreateShelterDto

```typescript
interface CreateShelterDto {
  name: string;                  // Obrigatório (2-255 caracteres)
  description?: string;          // Opcional
  teamsQuantity: number;         // ⭐ OBRIGATÓRIO (número)
  address: {
    street: string;              // Obrigatório
    number?: string;             // Opcional
    district: string;            // Obrigatório
    city: string;                // Obrigatório
    state: string;               // Obrigatório
    postalCode: string;          // Obrigatório
    complement?: string;         // Opcional
  };
  mediaItem?: {
    title?: string;
    description?: string;
    uploadType?: 'UPLOAD' | 'LINK';
    url?: string;
  };
}
```

### Tipo: UpdateShelterDto

```typescript
interface UpdateShelterDto {
  name?: string;                 // Opcional (2-255 caracteres)
  description?: string;          // Opcional
  teamsQuantity: number;         // ⭐ OBRIGATÓRIO (número) - mesmo em atualizações parciais
  address?: {
    id?: string;
    street?: string;
    number?: string;
    district?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    complement?: string;
  };
  mediaItem?: {
    id?: string;
    title?: string;
    description?: string;
    uploadType?: 'UPLOAD' | 'LINK';
    url?: string;
  };
}
```

**⚠️ IMPORTANTE:** O campo `teamsQuantity` é **obrigatório** no DTO, mesmo em atualizações parciais. Você sempre deve fornecer o valor atual desse campo ao atualizar um abrigo.

---

## 🔌 Endpoints Detalhados

### 1. Listar Abrigos (Paginado)

**Endpoint:** `GET /shelters`

**Descrição:** Lista abrigos com paginação e filtros avançados. Retorna todas as equipes de cada abrigo, incluindo líderes e professores de cada equipe.

**Autenticação:** Requerida (Bearer Token)

**Query Parameters:**

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `page` | number | Não | Número da página (padrão: 1) |
| `limit` | number | Não | Itens por página (padrão: 10) |
| `sort` | string | Não | Campo para ordenação (`name`, `createdAt`, `updatedAt`, `city`, `state`, padrão: `name`) |
| `order` | string | Não | Ordem (`ASC` ou `DESC`, padrão: `ASC`) |
| `shelterName` | string | Não | Busca por nome do abrigo (busca parcial) |
| `staffFilters` | string | Não | Busca por nome, email ou telefone de líderes/professores |
| `addressFilter` | string | Não | Busca por endereço (cidade, estado, bairro, etc.) |
| `teamId` | string (UUID) | Não | Filtrar abrigos que têm uma equipe específica |
| `teamName` | string | Não | Filtrar abrigos que têm equipes com número específico (ex: "1", "2") |
| `leaderId` | string (UUID) | Não | Filtrar por líder específico |
| `shelterId` | string (UUID) | Não | Filtrar por ID específico (compatibilidade) |
| `searchString` | string | Não | Busca geral (compatibilidade) |
| `nameSearchString` | string | Não | Busca por nome (compatibilidade) |

**Resposta de Sucesso (200):**

```typescript
interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

// Resposta será: PaginatedResponse<ShelterResponseDto>
```

**Exemplos de Requisição:**

```http
# Buscar abrigos por nome
GET /shelters?page=1&limit=10&shelterName=Esperança
Authorization: Bearer {token}

# Filtrar abrigos que têm uma equipe específica
GET /shelters?page=1&limit=10&teamId=990e8400-e29b-41d4-a716-446655440000
Authorization: Bearer {token}

# Filtrar abrigos que têm equipes com número "1"
GET /shelters?page=1&limit=10&teamName=1
Authorization: Bearer {token}

# Buscar abrigos por nome e filtrar por equipe
GET /shelters?page=1&limit=10&shelterName=Esperança&teamName=1
Authorization: Bearer {token}

# Buscar abrigos com múltiplos filtros
GET /shelters?page=1&limit=10&shelterName=Esperança&staffFilters=maria&addressFilter=São Paulo&teamName=1
Authorization: Bearer {token}
```

**Exemplo de Resposta:**

```json
{
  "items": [
    {
      "id": "770e8400-e29b-41d4-a716-446655440000",
  "name": "Abrigo Esperança",
      "description": "Abrigo localizado no centro",
      "teamsQuantity": 3,
  "address": {
        "id": "880e8400-e29b-41d4-a716-446655440000",
    "street": "Rua das Flores",
    "number": "123",
        "district": "Centro",
    "city": "São Paulo",
    "state": "SP",
        "postalCode": "01234-567",
        "complement": null,
        "createdAt": "2024-11-29T10:00:00.000Z",
        "updatedAt": "2024-11-29T10:00:00.000Z"
      },
      "teams": [
        {
          "id": "990e8400-e29b-41d4-a716-446655440000",
          "numberTeam": 1,
          "description": "Primeira equipe",
          "leaders": [
            {
              "id": "aa0e8400-e29b-41d4-a716-446655440000",
              "active": true,
              "user": {
                "id": "bb0e8400-e29b-41d4-a716-446655440000",
                "name": "João Silva",
                "email": "joao@example.com",
                "phone": "(11) 91234-5678",
                "active": true,
                "completed": true,
                "commonUser": false
              }
            }
          ],
          "teachers": [
            {
              "id": "cc0e8400-e29b-41d4-a716-446655440000",
              "active": true,
              "user": {
                "id": "dd0e8400-e29b-41d4-a716-446655440000",
                "name": "Maria Santos",
                "email": "maria@example.com",
                "phone": "(11) 98765-4321",
                "active": true,
                "completed": true,
                "commonUser": false
              }
            }
          ]
        }
      ],
      "leaders": [
        {
          "id": "aa0e8400-e29b-41d4-a716-446655440000",
          "active": true,
          "user": {
            "id": "bb0e8400-e29b-41d4-a716-446655440000",
            "name": "João Silva",
            "email": "joao@example.com",
            "phone": "(11) 91234-5678",
            "active": true,
            "completed": true,
            "commonUser": false
          }
        }
      ],
      "teachers": [
        {
          "id": "cc0e8400-e29b-41d4-a716-446655440000",
          "active": true,
          "user": {
            "id": "dd0e8400-e29b-41d4-a716-446655440000",
            "name": "Maria Santos",
            "email": "maria@example.com",
            "phone": "(11) 98765-4321",
            "active": true,
            "completed": true,
            "commonUser": false
          }
        }
      ],
      "mediaItem": null,
      "createdAt": "2024-11-29T10:00:00.000Z",
      "updatedAt": "2024-11-29T10:00:00.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10
}
```

**Nota:** O campo `teams` contém todas as equipes do abrigo com seus líderes e professores. Os campos `leaders` e `teachers` na raiz são calculados automaticamente agregando todos os membros de todas as equipes (para compatibilidade com código legado).

---

### 2. Listar Abrigos (Simples)

**Endpoint:** `GET /shelters/simple`

**Descrição:** Lista todos os abrigos de forma simplificada (sem paginação). Retorna todas as equipes de cada abrigo, incluindo líderes e professores de cada equipe.

**Autenticação:** Requerida (Bearer Token)

**Resposta de Sucesso (200):** `ShelterSimpleResponseDto[]`

**Exemplo de Requisição:**

```http
GET /shelters/simple
Authorization: Bearer {token}
```

**Exemplo de Resposta:**

```json
[
{
  "id": "770e8400-e29b-41d4-a716-446655440000",
  "name": "Abrigo Esperança",
    "description": "Abrigo localizado no centro",
    "teamsQuantity": 3,
  "address": {
    "id": "880e8400-e29b-41d4-a716-446655440000",
    "street": "Rua das Flores",
    "number": "123",
      "district": "Centro",
    "city": "São Paulo",
    "state": "SP",
      "postalCode": "01234-567",
      "complement": null,
      "createdAt": "2024-11-29T10:00:00.000Z",
      "updatedAt": "2024-11-29T10:00:00.000Z"
    },
    "teams": [
      {
        "id": "990e8400-e29b-41d4-a716-446655440000",
        "numberTeam": 1,
        "description": "Primeira equipe",
  "leaders": [],
        "teachers": []
      }
    ],
  "mediaItem": null,
  "createdAt": "2024-11-29T10:00:00.000Z",
  "updatedAt": "2024-11-29T10:00:00.000Z"
}
]
```

**Quando Usar:**
- Para preencher dropdowns/selects
- Para listas simples sem necessidade de paginação
- Quando você precisa de todos os abrigos de uma vez

---

### 3. Listar Abrigos (Select Options)

**Endpoint:** `GET /shelters/list`

**Descrição:** Lista abrigos em formato de opções para select (apenas abrigos com líderes). Este endpoint retorna dados simplificados para uso em selects.

**Autenticação:** Requerida (Bearer Token)

**Resposta de Sucesso (200):** `ShelterSelectOptionDto[]`

**Exemplo de Requisição:**

```http
GET /shelters/list
Authorization: Bearer {token}
```

**Quando Usar:**
- Para preencher selects/dropdowns
- Quando você precisa apenas de ID e nome
- Apenas abrigos que têm pelo menos um líder são retornados

---

### 4. Buscar Abrigo por ID

**Endpoint:** `GET /shelters/:id`

**Descrição:** Busca um abrigo específico por ID, incluindo todas as equipes com seus líderes e professores.

**Autenticação:** Requerida (Bearer Token)

**Parâmetros de URL:**

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `id` | string (UUID) | Sim | UUID do abrigo |

**Resposta de Sucesso (200):** `ShelterResponseDto`

**Resposta de Erro (404):** Abrigo não encontrado

**Exemplo de Requisição:**

```http
GET /shelters/770e8400-e29b-41d4-a716-446655440000
Authorization: Bearer {token}
```

**Exemplo de Resposta:**

```json
{
  "id": "770e8400-e29b-41d4-a716-446655440000",
  "name": "Abrigo Esperança",
  "description": "Abrigo localizado no centro",
  "teamsQuantity": 3,
  "address": {
    "id": "880e8400-e29b-41d4-a716-446655440000",
    "street": "Rua das Flores",
    "number": "123",
    "district": "Centro",
    "city": "São Paulo",
    "state": "SP",
    "postalCode": "01234-567",
    "complement": null,
    "createdAt": "2024-11-29T10:00:00.000Z",
    "updatedAt": "2024-11-29T10:00:00.000Z"
  },
  "teams": [
    {
      "id": "990e8400-e29b-41d4-a716-446655440000",
      "numberTeam": 1,
      "description": "Primeira equipe do abrigo",
      "leaders": [
        {
          "id": "aa0e8400-e29b-41d4-a716-446655440000",
          "active": true,
          "user": {
            "id": "bb0e8400-e29b-41d4-a716-446655440000",
            "name": "João Silva",
            "email": "joao@example.com",
            "phone": "(11) 91234-5678",
            "active": true,
            "completed": true,
            "commonUser": false
          }
        }
      ],
      "teachers": [
        {
          "id": "cc0e8400-e29b-41d4-a716-446655440000",
          "active": true,
          "user": {
            "id": "dd0e8400-e29b-41d4-a716-446655440000",
            "name": "Maria Santos",
            "email": "maria@example.com",
            "phone": "(11) 98765-4321",
            "active": true,
            "completed": true,
            "commonUser": false
          }
        }
      ]
    },
    {
      "id": "ee0e8400-e29b-41d4-a716-446655440000",
      "numberTeam": 2,
      "description": "Segunda equipe do abrigo",
      "leaders": [],
      "teachers": []
    }
  ],
  "leaders": [
    {
      "id": "aa0e8400-e29b-41d4-a716-446655440000",
      "active": true,
      "user": {
        "id": "bb0e8400-e29b-41d4-a716-446655440000",
        "name": "João Silva",
        "email": "joao@example.com",
        "phone": "(11) 91234-5678",
        "active": true,
        "completed": true,
        "commonUser": false
      }
    }
  ],
  "teachers": [
    {
      "id": "cc0e8400-e29b-41d4-a716-446655440000",
      "active": true,
      "user": {
        "id": "dd0e8400-e29b-41d4-a716-446655440000",
        "name": "Maria Santos",
        "email": "maria@example.com",
        "phone": "(11) 98765-4321",
        "active": true,
        "completed": true,
        "commonUser": false
      }
    }
  ],
  "mediaItem": null,
  "createdAt": "2024-11-29T10:00:00.000Z",
  "updatedAt": "2024-11-29T10:00:00.000Z"
}
```

---

### 5. Buscar Quantidade de Equipes do Abrigo

**Endpoint:** `GET /shelters/:id/teams-quantity`

**Descrição:** Retorna apenas a quantidade de equipes (`teamsQuantity`) de um abrigo específico. Este endpoint é usado como referência ao editar professores e líderes, permitindo que o frontend saiba quantas equipes o abrigo possui. **Quando não houver equipes cadastradas, retorna `teamsQuantity: 0`** (não lança erro).

**Autenticação:** Requerida (Bearer Token)

**Parâmetros de URL:**

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `id` | string (UUID) | Sim | UUID do abrigo |

**Resposta de Sucesso (200):**

```json
{
  "id": "770e8400-e29b-41d4-a716-446655440000",
  "teamsQuantity": 3
}
```

**Quando não houver equipes cadastradas:**

```json
{
  "id": "86226231-33d8-4bc9-8d1f-5e29441917c3",
  "teamsQuantity": 0
}
```

**Resposta de Erro (404):** Abrigo não encontrado

**Exemplo de Requisição:**

```http
GET /shelters/770e8400-e29b-41d4-a716-446655440000/teams-quantity
Authorization: Bearer {token}
```

**Exemplo de Resposta (com equipes):**

```json
{
  "id": "770e8400-e29b-41d4-a716-446655440000",
  "teamsQuantity": 3
}
```

**Exemplo de Resposta (sem equipes):**

```json
{
  "id": "86226231-33d8-4bc9-8d1f-5e29441917c3",
  "teamsQuantity": 0
}
```

**Quando Usar:**
- ⭐ **Principal uso:** Ao editar um professor ou líder, para saber quantas equipes o abrigo possui
- Para exibir informações sobre a quantidade de equipes sem carregar todos os dados do abrigo
- Para validações no frontend (ex: garantir que o número da equipe não exceda a quantidade total)

**Dica de Implementação:**
- Use este endpoint ao editar professores/líderes para obter a quantidade de equipes
- Com o valor retornado (`teamsQuantity`), crie um select/combobox de equipes (1, 2, 3... até `teamsQuantity`)
- Valide que o `numberTeam` escolhido não exceda o `teamsQuantity` do abrigo

---

### 6. Criar Abrigo

**Endpoint:** `POST /shelters`

**Descrição:** Cria um novo abrigo. Suporta JSON ou form-data (para upload de imagem).

**Autenticação:** Requerida (Bearer Token)

**Permissões:** Apenas administradores

**Content-Type:** `application/json` ou `multipart/form-data`

**Body (JSON):**

```json
{
  "name": "Abrigo Esperança",
  "description": "Abrigo localizado no centro da cidade",
  "teamsQuantity": 3,
  "address": {
    "street": "Rua das Flores",
    "number": "123",
    "district": "Centro",
    "city": "São Paulo",
    "state": "SP",
    "postalCode": "01234-567",
    "complement": "Apto 45"
  },
  "mediaItem": {
    "title": "Foto do Abrigo",
    "description": "Imagem principal",
    "uploadType": "LINK",
    "url": "https://example.com/image.jpg"
  }
}
```

**Body (Form-Data):**

```
shelterData: {"name": "Abrigo Esperança", "description": "...", "teamsQuantity": 3, "address": {...}}
image: [arquivo de imagem]
```

**Campos Obrigatórios:**
- `name` (string, 2-255 caracteres)
- `teamsQuantity` (number) ⭐ **OBRIGATÓRIO**
- `address` (objeto com dados do endereço)
  - `street` (string)
  - `district` (string)
  - `city` (string)
  - `state` (string)
  - `postalCode` (string)

**Campos Opcionais:**
- `description` (string)
- `address.number` (string)
- `address.complement` (string)
- `mediaItem` (objeto)

**Resposta de Sucesso (201):** `ShelterResponseDto`

**Resposta de Erro (400):** Dados inválidos
**Resposta de Erro (403):** Sem permissão
**Resposta de Erro (422):** Erro de validação

**Exemplo de Requisição (JSON):**

```http
POST /shelters
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Abrigo Esperança",
  "description": "Abrigo localizado no centro",
  "teamsQuantity": 3,
  "address": {
    "street": "Rua das Flores",
    "number": "123",
    "district": "Centro",
    "city": "São Paulo",
    "state": "SP",
    "postalCode": "01234-567"
  }
}
```

**Exemplo de Resposta:**

```json
{
  "id": "770e8400-e29b-41d4-a716-446655440000",
  "name": "Abrigo Esperança",
  "description": "Abrigo localizado no centro",
  "teamsQuantity": 3,
  "address": {
    "id": "880e8400-e29b-41d4-a716-446655440000",
    "street": "Rua das Flores",
    "number": "123",
    "district": "Centro",
    "city": "São Paulo",
    "state": "SP",
    "postalCode": "01234-567",
    "complement": null,
    "createdAt": "2024-11-29T10:00:00.000Z",
    "updatedAt": "2024-11-29T10:00:00.000Z"
  },
  "teams": [
    {
      "id": "990e8400-e29b-41d4-a716-446655440001",
      "numberTeam": 1,
      "description": "Equipe Matutina",
      "leaders": [
        {
          "id": "aa0e8400-e29b-41d4-a716-446655440001",
          "active": true,
          "user": {
            "id": "bb0e8400-e29b-41d4-a716-446655440001",
            "name": "João Silva",
            "email": "joao.silva@example.com",
            "phone": "(11) 91234-5678",
            "active": true,
            "completed": true,
            "commonUser": false
          }
        }
      ],
      "teachers": [
        {
          "id": "cc0e8400-e29b-41d4-a716-446655440001",
          "active": true,
          "user": {
            "id": "dd0e8400-e29b-41d4-a716-446655440001",
            "name": "Maria Santos",
            "email": "maria.santos@example.com",
            "phone": "(11) 98765-4321",
            "active": true,
            "completed": true,
            "commonUser": false
          }
        },
        {
          "id": "cc0e8400-e29b-41d4-a716-446655440002",
          "active": true,
          "user": {
            "id": "dd0e8400-e29b-41d4-a716-446655440002",
            "name": "Pedro Oliveira",
            "email": "pedro.oliveira@example.com",
            "phone": "(11) 97654-3210",
            "active": true,
            "completed": true,
            "commonUser": false
          }
        }
      ]
    },
    {
      "id": "990e8400-e29b-41d4-a716-446655440002",
      "numberTeam": 2,
      "description": "Equipe Vespertina",
      "leaders": [
        {
          "id": "aa0e8400-e29b-41d4-a716-446655440002",
          "active": true,
          "user": {
            "id": "bb0e8400-e29b-41d4-a716-446655440002",
            "name": "Ana Costa",
            "email": "ana.costa@example.com",
            "phone": "(11) 92345-6789",
            "active": true,
            "completed": true,
            "commonUser": false
          }
        }
      ],
      "teachers": [
        {
          "id": "cc0e8400-e29b-41d4-a716-446655440003",
          "active": true,
          "user": {
            "id": "dd0e8400-e29b-41d4-a716-446655440003",
            "name": "Carlos Mendes",
            "email": "carlos.mendes@example.com",
            "phone": "(11) 96543-2109",
            "active": true,
            "completed": true,
            "commonUser": false
          }
        }
      ]
    }
  ],
  "leaders": [
    {
      "id": "aa0e8400-e29b-41d4-a716-446655440001",
      "active": true,
      "user": {
        "id": "bb0e8400-e29b-41d4-a716-446655440001",
        "name": "João Silva",
        "email": "joao.silva@example.com",
        "phone": "(11) 91234-5678",
        "active": true,
        "completed": true,
        "commonUser": false
      }
    },
    {
      "id": "aa0e8400-e29b-41d4-a716-446655440002",
      "active": true,
      "user": {
        "id": "bb0e8400-e29b-41d4-a716-446655440002",
        "name": "Ana Costa",
        "email": "ana.costa@example.com",
        "phone": "(11) 92345-6789",
        "active": true,
        "completed": true,
        "commonUser": false
      }
    }
  ],
  "teachers": [
    {
      "id": "cc0e8400-e29b-41d4-a716-446655440001",
      "active": true,
      "user": {
        "id": "dd0e8400-e29b-41d4-a716-446655440001",
        "name": "Maria Santos",
        "email": "maria.santos@example.com",
        "phone": "(11) 98765-4321",
        "active": true,
        "completed": true,
        "commonUser": false
      }
    },
    {
      "id": "cc0e8400-e29b-41d4-a716-446655440002",
      "active": true,
      "user": {
        "id": "dd0e8400-e29b-41d4-a716-446655440002",
        "name": "Pedro Oliveira",
        "email": "pedro.oliveira@example.com",
        "phone": "(11) 97654-3210",
        "active": true,
        "completed": true,
        "commonUser": false
      }
    },
    {
      "id": "cc0e8400-e29b-41d4-a716-446655440003",
      "active": true,
      "user": {
        "id": "dd0e8400-e29b-41d4-a716-446655440003",
        "name": "Carlos Mendes",
        "email": "carlos.mendes@example.com",
        "phone": "(11) 96543-2109",
        "active": true,
        "completed": true,
        "commonUser": false
      }
    }
  ],
  "mediaItem": null,
  "createdAt": "2024-11-29T10:00:00.000Z",
  "updatedAt": "2024-11-29T10:00:00.000Z"
}
```

---

### 7. Atualizar Abrigo

**Endpoint:** `PUT /shelters/:id`

**Descrição:** Atualiza um abrigo existente. Suporta JSON ou form-data (para upload de imagem).

**Autenticação:** Requerida (Bearer Token)

**Permissões:** Apenas administradores (líderes podem atualizar apenas abrigos de suas equipes)

**Content-Type:** `application/json` ou `multipart/form-data`

**Parâmetros de URL:**

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `id` | string (UUID) | Sim | UUID do abrigo |

**Body (JSON):**

```json
{
  "name": "Abrigo Esperança Atualizado",
  "description": "Nova descrição",
  "teamsQuantity": 4
}
```

**⚠️ IMPORTANTE:** O campo `teamsQuantity` é **obrigatório** no DTO, mesmo em atualizações parciais. Você sempre deve fornecer o valor atual desse campo ao atualizar um abrigo.

**Resposta de Sucesso (200):** `ShelterResponseDto`

**Resposta de Erro (400):** Dados inválidos
**Resposta de Erro (403):** Sem permissão
**Resposta de Erro (404):** Abrigo não encontrado
**Resposta de Erro (422):** Erro de validação

**Exemplo de Requisição:**

```http
PUT /shelters/770e8400-e29b-41d4-a716-446655440000
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Abrigo Esperança Atualizado",
  "description": "Nova descrição",
  "teamsQuantity": 4
}
```

**Nota:** Todos os campos são opcionais, exceto `teamsQuantity` que é obrigatório. Você pode atualizar apenas os campos que deseja alterar, mas sempre deve incluir o campo `teamsQuantity` com seu valor atual.

---

### 8. Atualizar Mídia do Abrigo

**Endpoint:** `PATCH /shelters/:id/media`

**Descrição:** Atualiza apenas a imagem/mídia do abrigo. Suporta upload de arquivo ou link.

**Autenticação:** Requerida (Bearer Token)

**Permissões:** Apenas administradores (líderes podem atualizar apenas abrigos de suas equipes)

**Content-Type:** `multipart/form-data` ou `application/json`

**Parâmetros de URL:**

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `id` | string (UUID) | Sim | UUID do abrigo |

**Body (Form-Data):**

```
mediaData: {"title": "Nova Foto", "description": "...", "uploadType": "UPLOAD"}
image: [arquivo de imagem]
```

**Body (JSON):**

```json
{
  "title": "Nova Foto",
  "description": "Descrição da imagem",
  "uploadType": "LINK",
  "url": "https://example.com/new-image.jpg"
}
```

**Resposta de Sucesso (200):** `ShelterResponseDto`

**Resposta de Erro (400):** Dados inválidos
**Resposta de Erro (403):** Sem permissão
**Resposta de Erro (404):** Abrigo não encontrado

**Exemplo de Requisição (Form-Data):**

```http
PATCH /shelters/770e8400-e29b-41d4-a716-446655440000/media
Authorization: Bearer {token}
Content-Type: multipart/form-data

mediaData: {"title": "Foto Atualizada", "uploadType": "UPLOAD"}
image: [arquivo]
```

**Exemplo de Requisição (JSON):**

```http
PATCH /shelters/770e8400-e29b-41d4-a716-446655440000/media
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Foto Atualizada",
  "description": "Nova descrição",
  "uploadType": "LINK",
  "url": "https://example.com/image.jpg"
}
```

---

### 9. Deletar Abrigo

**Endpoint:** `DELETE /shelters/:id`

**Descrição:** Remove um abrigo e todas as suas equipes (cascade). Líderes e professores são desvinculados das equipes (team_id = null).

**Autenticação:** Requerida (Bearer Token)

**Permissões:** Apenas administradores

**Parâmetros de URL:**

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `id` | string (UUID) | Sim | UUID do abrigo |

**Resposta de Sucesso (200):**

```json
{
  "message": "Abrigo removido com sucesso"
}
```

**Resposta de Erro (403):** Sem permissão
**Resposta de Erro (404):** Abrigo não encontrado

**Exemplo de Requisição:**

```http
DELETE /shelters/770e8400-e29b-41d4-a716-446655440000
Authorization: Bearer {token}
```

**⚠️ ATENÇÃO:** Esta operação é irreversível. Ao deletar um abrigo:
- Todas as equipes do abrigo são deletadas
- Líderes e professores são desvinculados (team_id = null)
- Abrigados (Sheltered) são desvinculados (shelter_id = null)

---

## 💻 DTOs de Entrada e Saída

### DTOs de Entrada (Request)

#### CreateShelterDto
```typescript
interface CreateShelterDto {
  name: string;                  // Obrigatório (2-255 caracteres)
  description?: string;          // Opcional
  teamsQuantity: number;         // ⭐ OBRIGATÓRIO (número)
  address: {
    street: string;              // Obrigatório
    number?: string;             // Opcional
    district: string;            // Obrigatório
    city: string;                // Obrigatório
    state: string;               // Obrigatório
    postalCode: string;          // Obrigatório
    complement?: string;         // Opcional
  };
  mediaItem?: {
    title?: string;
    description?: string;
    uploadType?: 'UPLOAD' | 'LINK';
    url?: string;
  };
}
```

#### UpdateShelterDto
```typescript
interface UpdateShelterDto {
  name?: string;                 // Opcional (2-255 caracteres)
  description?: string;          // Opcional
  teamsQuantity: number;         // ⭐ OBRIGATÓRIO (número) - mesmo em atualizações parciais
  address?: {
    id?: string;
    street?: string;
    number?: string;
    district?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    complement?: string;
  };
  mediaItem?: {
    id?: string;
    title?: string;
    description?: string;
    uploadType?: 'UPLOAD' | 'LINK';
    url?: string;
  };
}
```

**⚠️ IMPORTANTE:** O campo `teamsQuantity` é **obrigatório** no DTO, mesmo em atualizações parciais. Você sempre deve fornecer o valor atual desse campo ao atualizar um abrigo.

#### QuerySheltersDto (Query Parameters)
```typescript
interface QuerySheltersDto {
  page?: number;                 // Padrão: 1
  limit?: number;                // Padrão: 10
  sort?: 'name' | 'createdAt' | 'updatedAt' | 'city' | 'state';
  order?: 'ASC' | 'DESC';
  shelterName?: string;          // Busca por nome do abrigo
  staffFilters?: string;         // Busca por nome, email ou telefone de líderes/professores
  addressFilter?: string;        // Busca por endereço
  teamId?: string;               // Filtrar por equipe específica (UUID)
  teamName?: string;             // Filtrar por número da equipe (ex: "1", "2")
  leaderId?: string;             // Filtrar por líder específico
  shelterId?: string;            // Filtrar por ID específico
  searchString?: string;         // Busca geral (compatibilidade)
  nameSearchString?: string;     // Busca por nome (compatibilidade)
}
```

### DTOs de Saída (Response)

#### ShelterResponseDto
```typescript
interface ShelterResponseDto {
  id: string;
  name: string;
  description?: string;
  teamsQuantity?: number;        // Quantidade de equipes
  address: AddressDto;
  teams: TeamWithMembersDto[];   // Array de equipes com líderes e professores
  leaders: CoordinatorDto[];     // TODOS os líderes (agregado de todas as equipes)
  teachers: TeacherDto[];        // TODOS os professores (agregado de todas as equipes)
  mediaItem?: MediaItemDto | null;
  createdAt: Date;
  updatedAt: Date;
}
```

#### ShelterSimpleResponseDto
```typescript
interface ShelterSimpleResponseDto {
  id: string;
  name: string;
  description?: string;
  teamsQuantity?: number;
  address: AddressDto;
  teams: TeamWithMembersDto[];
  mediaItem?: MediaItemDto | null;
  createdAt: Date;
  updatedAt: Date;
}
```

#### ShelterTeamsQuantityResponseDto
```typescript
interface ShelterTeamsQuantityResponseDto {
  id: string;
  teamsQuantity: number;
}
```

#### PaginatedResponse<T>
```typescript
interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}
```

---

## 💡 Dicas de Implementação

### 1. Listar Abrigos
- **DTO de Entrada:** `QuerySheltersDto` (query parameters)
- **DTO de Saída:** `PaginatedResponse<ShelterResponseDto>`
- **Dica:** Use `URLSearchParams` para construir a query string. Todos os parâmetros são opcionais.

### 2. Buscar Abrigo por ID
- **DTO de Entrada:** `id` (path parameter - UUID)
- **DTO de Saída:** `ShelterResponseDto`
- **Dica:** O objeto retornado já inclui todas as equipes com seus líderes e professores.

### 3. Buscar Quantidade de Equipes
- **DTO de Entrada:** `id` (path parameter - UUID)
- **DTO de Saída:** `ShelterTeamsQuantityResponseDto`
- **Dica:** ⭐ Use este endpoint ao editar professores/líderes para saber quantas equipes o abrigo possui e criar um select de equipes (1, 2, 3... até `teamsQuantity`).

### 4. Criar Abrigo
- **DTO de Entrada:** `CreateShelterDto` (JSON ou Form-Data)
- **DTO de Saída:** `ShelterResponseDto`
- **Dica:** 
  - Para upload de imagem, use `multipart/form-data` com `shelterData` (JSON stringificado) e `image` (arquivo)
  - O campo `teamsQuantity` é obrigatório
  - O campo `address` é obrigatório

### 5. Atualizar Abrigo
- **DTO de Entrada:** `UpdateShelterDto` (JSON ou Form-Data)
- **DTO de Saída:** `ShelterResponseDto`
- **Dica:** 
  - ⚠️ **IMPORTANTE:** O campo `teamsQuantity` é obrigatório mesmo em atualizações parciais
  - Se você não tem o valor atual, busque o abrigo primeiro com `GET /shelters/:id` para obter o `teamsQuantity` atual
  - Todos os outros campos são opcionais

### 6. Atualizar Mídia
- **DTO de Entrada:** 
  - JSON: `{ title?, description?, uploadType, url? }`
  - Form-Data: `mediaData` (JSON stringificado) + `image` (arquivo)
- **DTO de Saída:** `ShelterResponseDto`
- **Dica:** Use Form-Data para upload de arquivo, JSON para link externo.

### 7. Deletar Abrigo
- **DTO de Entrada:** `id` (path parameter - UUID)
- **DTO de Saída:** `{ message: string }`
- **Dica:** ⚠️ Esta operação é irreversível e deleta todas as equipes do abrigo (cascade).

### Validações Importantes
- `teamsQuantity` deve ser um número maior que 0
- `name` deve ter entre 2 e 255 caracteres
- `address` é obrigatório ao criar
- Campos de endereço obrigatórios: `street`, `district`, `city`, `state`, `postalCode`

### Tratamento de Erros
- **400:** Dados inválidos - verifique os campos obrigatórios
- **401:** Não autenticado - redirecione para login
- **403:** Sem permissão - apenas admins podem criar/editar/deletar
- **404:** Abrigo não encontrado
- **422:** Erro de validação - exiba os erros retornados no campo `errors`

---

## 🔄 Fluxos de Trabalho Comuns

### Fluxo 1: Criar Abrigo
1. Use `POST /shelters` com `CreateShelterDto`
2. ⚠️ **Lembre-se:** O campo `teamsQuantity` é obrigatório
3. Para upload de imagem, use `multipart/form-data` com `shelterData` (JSON stringificado) e `image` (arquivo)

### Fluxo 2: Atualizar Abrigo
1. ⚠️ **IMPORTANTE:** Busque o abrigo atual primeiro com `GET /shelters/:id` para obter o `teamsQuantity` atual
2. Use `PUT /shelters/:id` com `UpdateShelterDto`
3. Sempre inclua o campo `teamsQuantity` com seu valor atual (ou novo valor se estiver alterando)

### Fluxo 3: Buscar Quantidade de Equipes para Editar Professor/Líder
1. Use `GET /shelters/:shelterId/teams-quantity` para obter a quantidade de equipes
2. Use o valor retornado (`teamsQuantity`) para criar um select de equipes (1, 2, 3... até `teamsQuantity`)
3. Ao editar professor/líder, use este valor para validar que o `numberTeam` não exceda a quantidade total

### Fluxo 4: Exibir Abrigo com Equipes
1. Use `GET /shelters/:id` para obter o abrigo completo
2. O objeto `ShelterResponseDto` já inclui:
   - `teams`: Array de equipes com seus líderes e professores
   - `leaders`: Array agregado de todos os líderes (compatibilidade)
   - `teachers`: Array agregado de todos os professores (compatibilidade)
3. Use `shelter.teams` para exibir as equipes individualmente
4. Use `shelter.teams[].numberTeam` para exibir o número da equipe (1, 2, 3...)

---

## 🔗 Gerenciamento de Equipes

**Nota:** O gerenciamento de equipes (criar, atualizar, deletar) é feito através do módulo **Teams** (`/teams`). Para adicionar líderes e professores a um abrigo, use os endpoints dos módulos **Líder** e **Professor**:

- `PUT /leader-profiles/:leaderId/team` - Adicionar/mover líder
- `PUT /teacher-profiles/:teacherId/team` - Adicionar/mover professor

Veja os documentos:
- [Módulo Líder](./MODULO_LIDER.md)
- [Módulo Professor](./MODULO_PROFESSOR.md)

---

## ⚠️ Regras e Validações

1. **Equipes:**
   - Um abrigo pode ter múltiplas equipes
   - Cada equipe é identificada por um **número** (1, 2, 3, 4...)
   - O campo `numberTeam` é do tipo **number** (não string)
   - Ao deletar um abrigo, todas as suas equipes são deletadas (cascade)

2. **Atributo teamsQuantity:**
   - Campo obrigatório nos DTOs de criação e atualização
   - É um número (number) que representa a quantidade de equipes que o abrigo possui
   - Sempre deve ser fornecido, mesmo em atualizações parciais
   - ⭐ Usado como referência ao editar professores e líderes

3. **Endereço:**
   - O endereço é obrigatório ao criar um abrigo
   - O endereço pode ser atualizado parcialmente

4. **Mídia:**
   - A mídia é opcional
   - Suporta upload de arquivo ou link externo
   - Apenas uma imagem por abrigo

5. **Filtros:**
   - `staffFilters` busca em líderes e professores de todas as equipes
   - `addressFilter` busca em todos os campos do endereço
   - `leaderId` filtra abrigos que têm o líder em alguma equipe
   - `teamName` filtra por número da equipe (ex: "1", "2")

6. **Permissões:**
   - Apenas administradores podem criar, atualizar e deletar abrigos
   - Líderes podem visualizar abrigos de suas equipes

---

## 🔗 Relacionamentos

### Com Equipes
- Um abrigo tem **múltiplas equipes**
- Cada equipe pertence a **1 abrigo**
- Equipes são identificadas por números (1, 2, 3, 4...) - campo `numberTeam` (tipo number)

### Com Líderes e Professores
- Líderes e professores estão vinculados a abrigos **através de equipes**
- ⭐ **Líderes podem estar em múltiplas equipes** (ManyToMany) - podem estar em equipes do mesmo abrigo ou de abrigos diferentes
- **Professores podem estar em apenas 1 equipe** (ManyToOne) - não podem estar em múltiplas equipes ou abrigos
- Um abrigo pode ter múltiplos líderes e professores (distribuídos em equipes)
- As propriedades `leaders` e `teachers` na resposta agregam todos os membros de todas as equipes

### Com Abrigados
- ⭐ **Abrigados (Sheltered) têm relacionamento DIRETO com Abrigo** - NÃO passam por equipes
- Um abrigado pode estar em apenas 1 abrigo

### Com Endereços
- Cada abrigo tem **1 endereço**
- O endereço é criado junto com o abrigo

### Com Mídia
- Cada abrigo pode ter **1 imagem**
- A imagem pode ser um upload ou um link externo

---

**Última atualização:** 2024-12-06

**Mudanças recentes:**
- ⭐ **Atualizado:** Líderes agora podem estar em **múltiplas equipes** (ManyToMany)
- ⭐ **Atualizado:** Professores continuam podendo estar em apenas **1 equipe** (ManyToOne)
