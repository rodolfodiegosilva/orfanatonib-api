# 👥 Módulo Líder - Guia Completo para Frontend

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

O módulo de **Líder** gerencia os perfis de líderes do sistema. Cada líder está vinculado a um usuário e pode estar associado a uma equipe (team), que por sua vez está vinculada a um abrigo (shelter).

### 🎯 Conceitos Principais

- **Líder (Leader)**: Coordenador que pertence a uma equipe
- **Equipe (Team)**: Grupo de trabalho dentro de um abrigo, identificado por um **número** (1, 2, 3, 4...)
- **Abrigo (Shelter)**: Unidade física que abriga pessoas
- **Usuário (User)**: Conta de acesso ao sistema

### 🏗️ Estrutura de Relacionamentos

```
┌─────────────┐
│    USER     │ (Usuário)
│  (Usuário)  │
└──────┬──────┘
       │
       │ 1:1 (OneToOne)
       │
       ▼
┌─────────────┐
│   LEADER    │ (Perfil do Líder)
│   PROFILE   │
└──────┬──────┘
       │
       │ N:1 (ManyToOne) - nullable
       │
       ▼
┌─────────────┐
│    TEAM     │ (Equipe)
│  (Equipe)   │
└──────┬──────┘
       │
       │ N:1 (ManyToOne)
       │
       ▼
┌─────────────┐
│   SHELTER   │ (Abrigo)
│  (Abrigo)   │
└─────────────┘
```

**Fluxo de Relacionamento:**
```
Líder → Equipe → Abrigo
```

### 📌 Regras Importantes

1. **Relacionamento com Equipe:**
   - Um líder pode pertencer a apenas **1 equipe** (ou nenhuma)
   - Uma equipe pode ter **múltiplos líderes**
   - Uma equipe pertence a **1 abrigo**
   - Um abrigo pode ter **múltiplas equipes**
   - A equipe é identificada por um **número** (1, 2, 3, 4...), não por um nome descritivo
   - O campo `numberTeam` é do tipo **number** (não string)

2. **Relacionamento com Abrigo:**
   - **Líderes NÃO têm relacionamento direto com abrigos**, apenas através de equipes
   - Para vincular um líder a um abrigo, você deve vinculá-lo a uma equipe do abrigo

3. **Vinculação:**
   - Se o líder já estiver vinculado a outra equipe, será automaticamente movido para a nova
   - Se a equipe não existir, será criada automaticamente

---

## 📊 Estrutura de Dados

### Tipo: LeaderResponseDto

```typescript
interface LeaderResponseDto {
  id: string;                // UUID do perfil
  active: boolean;           // Status ativo/inativo
  user: {                    // Dados do usuário
    id: string;
    name: string;
    email: string;
    phone: string;
    active: boolean;
    completed: boolean;
    commonUser: boolean;
  };
  shelter?: {                // Abrigo (através da equipe)
    id: string;
    name: string;
    team: {                  // Equipe à qual o líder pertence (dentro do abrigo)
      id: string;
      numberTeam: number;    // Número da equipe: 1, 2, 3, 4... (tipo number)
      description?: string;
    } | null;
    teachers: {              // Professores da equipe
      id: string;
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
    }[];
  } | null;
  createdAt: Date;
  updatedAt: Date;
}
```

**Estrutura de Relacionamento na Resposta:**
```
Líder
  └── shelter (Abrigo)
        └── team (Equipe à qual o líder pertence)
        └── teachers (Professores da equipe)
```

### Tipo: LeaderSimpleListDto

```typescript
interface LeaderSimpleListDto {
  leaderProfileId: string;  // UUID do perfil
  name: string;              // Nome do usuário (ou email se não tiver nome)
  vinculado: boolean;        // Se está vinculado a uma equipe/abrigo
}
```

---

## 🔌 Endpoints Disponíveis

### 1. Listar Líderes (Paginado)

**Endpoint:** `GET /leader-profiles`

**Descrição:** Lista líderes com paginação e filtros.

**Autenticação:** Requerida (Bearer Token)

**Permissões:** Apenas administradores e líderes (professores não podem acessar)

**Query Parameters:**

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `page` | number | Não | Número da página (padrão: 1) |
| `limit` | number | Não | Itens por página (padrão: 12, máximo: 100) |
| `leaderSearchString` | string | Não | Busca por nome, email ou telefone do líder |
| `shelterSearchString` | string | Não | Busca por dados do abrigo (nome, endereço) |
| `hasShelter` | boolean | Não | Filtrar por líderes vinculados a abrigos (true/false) |
| `teamId` | string | Não | Filtrar por ID da equipe específica |
| `teamName` | string | Não | Filtrar por número da equipe (busca parcial) |
| `hasTeam` | boolean | Não | Filtrar por líderes vinculados a equipes (true/false) |
| `sort` | string | Não | Campo para ordenação (`updatedAt`, `createdAt`, `name`, padrão: `updatedAt`) |
| `order` | string | Não | Ordem (`asc` ou `desc`, padrão: `desc`) |

**Resposta:** `PageDto<LeaderResponseDto>`

**Exemplo:**
```http
GET /leader-profiles?page=1&limit=10&leaderSearchString=joao&hasShelter=true
Authorization: Bearer {token}
```

**Exemplo de Resposta:**
```json
{
  "items": [
    {
      "id": "aa0e8400-e29b-41d4-a716-446655440001",
      "active": true,
      "user": {
        "id": "bb0e8400-e29b-41d4-a716-446655440001",
        "name": "João Silva",
        "email": "joao@example.com",
        "phone": "(11) 91234-5678",
        "active": true,
        "completed": true,
        "commonUser": false
      },
      "shelter": {
        "id": "770e8400-e29b-41d4-a716-446655440000",
        "name": "Abrigo Esperança",
        "team": {
          "id": "990e8400-e29b-41d4-a716-446655440001",
          "numberTeam": 1,
          "description": "Equipe Matutina"
        },
        "teachers": [
          {
            "id": "660e8400-e29b-41d4-a716-446655440000",
            "active": true,
            "user": {
              "id": "550e8400-e29b-41d4-a716-446655440000",
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
      "createdAt": "2024-11-29T10:00:00.000Z",
      "updatedAt": "2024-11-29T10:00:00.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10
}
```

---

### 2. Listar Líderes (Simples)

**Endpoint:** `GET /leader-profiles/simple`

**Descrição:** Lista todos os líderes de forma simplificada (apenas ID, nome e status de vinculação).

**Autenticação:** Requerida (Bearer Token)

**Permissões:** Apenas administradores e líderes

**Resposta:** `LeaderSimpleListDto[]`

**Exemplo:**
```http
GET /leader-profiles/simple
Authorization: Bearer {token}
```

**Exemplo de Resposta:**
```json
[
  {
    "leaderProfileId": "aa0e8400-e29b-41d4-a716-446655440001",
    "name": "João Silva",
    "vinculado": true
  },
  {
    "leaderProfileId": "aa0e8400-e29b-41d4-a716-446655440002",
    "name": "Pedro Oliveira",
    "vinculado": false
  }
]
```

---

### 3. Buscar Líder por ID

**Endpoint:** `GET /leader-profiles/:id`

**Descrição:** Busca um líder específico por seu ID.

**Autenticação:** Requerida (Bearer Token)

**Permissões:** Apenas administradores e líderes

**Parâmetros:**

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `id` | string (UUID) | Sim | UUID do perfil do líder |

**Resposta:** `LeaderResponseDto`

**Exemplo:**
```http
GET /leader-profiles/aa0e8400-e29b-41d4-a716-446655440001
Authorization: Bearer {token}
```

**Exemplo de Resposta:**
```json
{
  "id": "aa0e8400-e29b-41d4-a716-446655440001",
  "active": true,
  "user": {
    "id": "bb0e8400-e29b-41d4-a716-446655440001",
    "name": "João Silva",
    "email": "joao@example.com",
    "phone": "(11) 91234-5678",
    "active": true,
    "completed": true,
    "commonUser": false
  },
  "shelter": {
    "id": "770e8400-e29b-41d4-a716-446655440000",
    "name": "Abrigo Esperança",
    "team": {
      "id": "990e8400-e29b-41d4-a716-446655440001",
      "numberTeam": 1,
      "description": "Equipe Matutina"
    },
    "teachers": [
      {
        "id": "660e8400-e29b-41d4-a716-446655440000",
        "active": true,
        "user": {
          "id": "550e8400-e29b-41d4-a716-446655440000",
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
  "createdAt": "2024-11-29T10:00:00.000Z",
  "updatedAt": "2024-11-29T10:00:00.000Z"
}
```

---

### 4. Vincular Líder a Equipe de um Abrigo ⭐

**Endpoint:** `PUT /leader-profiles/:leaderId`

**Descrição:** Vincula o líder a uma equipe de um abrigo. Se já estiver vinculado a outra equipe, move para a nova. Se a equipe não existir, cria automaticamente.

**Autenticação:** Requerida (Bearer Token)

**Permissões:** Apenas administradores e líderes

**Parâmetros:**

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `leaderId` | string (UUID) | Sim | UUID do perfil do líder |

**Body:** `ManageLeaderTeamDto`

```typescript
{
  shelterId: string;    // UUID do abrigo (obrigatório)
  numberTeam: number;   // Número da equipe: 1, 2, 3, 4... (obrigatório, mínimo: 1)
}
```

**Comportamento:**
- ✅ Busca a equipe com o `numberTeam` especificado no abrigo
- ✅ Se a equipe não existir, cria uma nova equipe automaticamente
- ✅ Se o líder já estiver vinculado a outra equipe, remove da anterior e vincula à nova
- ✅ Se o líder não estiver vinculado, apenas vincula à equipe

**Resposta:** `LeaderResponseDto`

**Exemplo:**
```http
PUT /leader-profiles/aa0e8400-e29b-41d4-a716-446655440001
Authorization: Bearer {token}
Content-Type: application/json

{
  "shelterId": "770e8400-e29b-41d4-a716-446655440000",
  "numberTeam": 1
}
```

---

## 💻 DTOs de Entrada e Saída

Esta seção documenta **todos** os DTOs utilizados no módulo de Líder, incluindo DTOs internos e de paginação.

### DTOs de Entrada (Request)

#### ManageLeaderTeamDto
```typescript
interface ManageLeaderTeamDto {
  shelterId: string;    // UUID do abrigo (obrigatório)
  numberTeam: number;   // Número da equipe: 1, 2, 3, 4... (obrigatório, mínimo: 1)
}
```

**⚠️ IMPORTANTE:**
- `shelterId` e `numberTeam` são **obrigatórios**
- `numberTeam` é do tipo **number** (não string)
- Se a equipe não existir, será criada automaticamente
- Se o líder já estiver em outra equipe, será movido automaticamente

#### LeaderProfilesQueryDto (Query Parameters)
```typescript
interface LeaderProfilesQueryDto {
  // 🔍 FILTROS DE BUSCA
  
  // Busca pelos dados do líder: nome, email ou telefone
  leaderSearchString?: string;
  
  // Busca por todos os campos do abrigo (nome, endereço, etc.)
  shelterSearchString?: string;
  
  // Se está vinculado a algum abrigo ou não
  // true = apenas líderes vinculados a abrigos
  // false = apenas líderes não vinculados
  hasShelter?: boolean;
  
  // 🔍 FILTROS DE EQUIPE
  
  // Filtrar por ID da equipe específica (UUID)
  teamId?: string;
  
  // Filtrar por número da equipe (busca parcial)
  // Ex: "1" retorna equipes com numberTeam = 1
  teamName?: string;
  
  // Se está vinculado a alguma equipe ou não
  // true = apenas líderes vinculados a equipes
  // false = apenas líderes não vinculados
  hasTeam?: boolean;
  
  // 📄 PAGINAÇÃO
  
  // Número da página (padrão: 1, mínimo: 1)
  page?: number;
  
  // Itens por página (padrão: 12, mínimo: 1, máximo: 100)
  limit?: number;
  
  // 🔄 ORDENAÇÃO
  
  // Campo para ordenação
  // 'updatedAt' = data de atualização (padrão)
  // 'createdAt' = data de criação
  // 'name' = nome do líder
  sort?: 'updatedAt' | 'createdAt' | 'name';
  
  // Direção da ordenação
  // 'desc' = decrescente (padrão)
  // 'asc' = crescente
  order?: 'asc' | 'desc';
}
```

**Notas sobre Filtros:**
- Todos os filtros são opcionais
- `hasShelter` e `hasTeam` aceitam valores booleanos: `true`, `false`, `1`, `0`, `yes`, `no`, `y`, `n`
- `leaderSearchString` e `shelterSearchString` fazem busca parcial (LIKE)
- `teamName` faz busca parcial no número da equipe
- `page` e `limit` são convertidos automaticamente para números

### DTOs de Saída (Response)

#### PageDto<T> (Resposta Paginada)
```typescript
interface PageDto<T> {
  items: T[];        // Array de itens da página atual
  total: number;     // Total de itens encontrados (todas as páginas)
  page: number;      // Número da página atual
  limit: number;     // Quantidade de itens por página
}
```

**Exemplo de Uso:**
```typescript
// Resposta do GET /leader-profiles?page=1&limit=10
const response: PageDto<LeaderResponseDto> = {
  items: [
    // ... array de LeaderResponseDto
  ],
  total: 25,    // Total de 25 líderes encontrados
  page: 1,      // Página atual: 1
  limit: 10     // 10 itens por página
};

// Calcular total de páginas
const totalPages = Math.ceil(response.total / response.limit); // 3 páginas
```

#### LeaderSimpleListDto
```typescript
interface LeaderSimpleListDto {
  leaderProfileId: string;  // UUID do perfil do líder
  name: string;              // Nome do usuário (ou email se não tiver nome, ou "—" se não tiver nenhum)
  vinculado: boolean;        // Se está vinculado a uma equipe/abrigo
}
```

**Notas:**
- Usado no endpoint `GET /leader-profiles/simple`
- Campo `name` retorna o nome do usuário, ou email se não tiver nome, ou "—" se não tiver nenhum
- Campo `vinculado` indica se o líder tem uma equipe associada (e consequentemente um abrigo)

#### LeaderResponseDto (Resposta Completa)
```typescript
interface LeaderResponseDto {
  id: string;                // UUID do perfil do líder
  active: boolean;           // Status ativo/inativo do perfil
  user: UserMiniDto;         // Dados do usuário associado
  shelter?: ShelterMiniWithCoordinatorDto | null;  // Abrigo (através da equipe) ou null
  createdAt: Date;           // Data de criação
  updatedAt: Date;           // Data de última atualização
}
```

**Estrutura do `shelter`:**
- Quando o líder está vinculado a uma equipe, o `shelter` contém:
  - `id` e `name` do abrigo
  - `team` (equipe à qual o líder pertence) com `id`, `numberTeam` e `description`
  - `teachers` (array de professores da equipe)
- Quando o líder não está vinculado, `shelter` é `null`

#### UserMiniDto (DTO Interno)
```typescript
interface UserMiniDto {
  id: string;                // UUID do usuário
  name: string;              // Nome completo
  email: string;             // Email
  phone: string;             // Telefone
  active: boolean;           // Status ativo/inativo
  completed: boolean;        // Se o cadastro está completo
  commonUser: boolean;       // Se é usuário comum
}
```

#### TeamMiniDto (DTO Interno)
```typescript
interface TeamMiniDto {
  id: string;                // UUID da equipe
  numberTeam: number;        // Número da equipe: 1, 2, 3, 4... (tipo number)
  description?: string;      // Descrição da equipe (opcional)
}
```

#### ShelterMiniWithCoordinatorDto (DTO Interno)
```typescript
interface ShelterMiniWithCoordinatorDto {
  id: string;                // UUID do abrigo
  name: string;              // Nome do abrigo
  team: TeamMiniDto | null;  // Equipe à qual o líder pertence (dentro do abrigo)
  teachers: TeacherMiniDto[];  // Professores da equipe
}
```

**Nota:** A estrutura mostra `shelter.team`, indicando que a equipe está dentro do abrigo, refletindo o relacionamento: Líder → Equipe → Abrigo.

#### TeacherMiniDto (DTO Interno)
```typescript
interface TeacherMiniDto {
  id: string;                // UUID do perfil do professor
  active: boolean;           // Status ativo/inativo
  user: UserMiniDto;         // Dados do usuário
}
```

#### LeaderMiniDto (DTO Interno - usado em outros módulos)
```typescript
interface LeaderMiniDto {
  id: string;                // UUID do perfil do líder
  active: boolean;           // Status ativo/inativo
  user: UserMiniDto;         // Dados do usuário
}
```


---

## 💡 Dicas de Implementação

### 1. Listar Líderes
- **DTO de Entrada:** `LeaderProfilesQueryDto` (query parameters)
- **DTO de Saída:** `PageDto<LeaderResponseDto>`
- **Dica:** Use `URLSearchParams` para construir a query string. Todos os parâmetros são opcionais.

### 2. Listar Líderes (Simples)
- **DTO de Entrada:** Nenhum (apenas autenticação)
- **DTO de Saída:** `LeaderSimpleListDto[]`
- **Dica:** Use este endpoint para listas de seleção (selects, comboboxes) onde você só precisa do ID e nome.

### 3. Buscar Líder por ID
- **DTO de Entrada:** `id` (path parameter - UUID)
- **DTO de Saída:** `LeaderResponseDto`
- **Dica:** O campo `shelter` será `null` se o líder não estiver vinculado a uma equipe/abrigo.

### 4. Vincular Líder a Equipe
- **DTO de Entrada:** `ManageLeaderTeamDto` (obrigatório: `shelterId` e `numberTeam`)
- **DTO de Saída:** `LeaderResponseDto`
- **Dicas:**
  - ⭐ Antes de vincular, busque `GET /shelters/:shelterId/teams-quantity` para validar que `numberTeam` não exceda a quantidade total
  - Se a equipe não existir, será criada automaticamente
  - Se o líder já estiver em outra equipe, será movido automaticamente para a nova

### Validações Importantes
- `shelterId` e `numberTeam` são obrigatórios
- `numberTeam` deve ser um número maior que 0
- `numberTeam` não deve exceder o `teamsQuantity` do abrigo (valide antes de enviar)
- O líder será automaticamente removido da equipe anterior ao ser adicionado a uma nova

### Tratamento de Erros
- **400:** Dados inválidos - verifique os campos obrigatórios
- **401:** Não autenticado - redirecione para login
- **403:** Sem permissão - apenas admins e líderes podem gerenciar líderes
- **404:** Líder não encontrado
- **422:** Erro de validação - exiba os erros retornados no campo `errors`

---

## 🔄 Fluxos de Trabalho Comuns

### Fluxo 1: Vincular Líder a Equipe de um Abrigo
1. ⭐ Busque a quantidade de equipes: `GET /shelters/:shelterId/teams-quantity`
2. Use `PUT /leader-profiles/:leaderId` com `{ shelterId: "...", numberTeam: 1 }`
3. Valide que `numberTeam` não exceda o `teamsQuantity` do abrigo
4. Se a equipe não existir, será criada automaticamente
5. Se o líder já estiver em outra equipe, será movido automaticamente

### Fluxo 2: Mover Líder entre Equipes
1. Use `PUT /leader-profiles/:leaderId` com `{ shelterId: "...", numberTeam: 2 }` (nova equipe)
2. O sistema remove automaticamente da equipe anterior e adiciona à nova

### Fluxo 3: Verificar Status de Vinculação
1. Use `GET /leader-profiles/:id`
2. Verifique o campo `shelter`:
   - Se `shelter` for `null`, o líder não está vinculado
   - Se `shelter` tiver dados, o líder está vinculado através de uma equipe
3. Para obter detalhes da equipe, busque o abrigo completo: `GET /shelters/:shelterId`

---

## ⚠️ Regras e Validações

1. **Um líder por equipe:**
   - Um líder pode pertencer a apenas **1 equipe** (ou nenhuma)
   - Se você adicionar um líder a uma nova equipe, ele será automaticamente removido da equipe anterior
   - **Não há relacionamento direto** entre líder e abrigo - sempre através de equipe

2. **Criação de equipe:**
   - Ao vincular um líder a um abrigo sem equipe correspondente, uma nova equipe será criada automaticamente
   - A equipe é identificada por um **número** (1, 2, 3, 4...), não por um nome descritivo
   - O campo `numberTeam` é do tipo **number** (não string)

3. **Permissões:**
   - Professores não podem acessar a listagem de outros líderes
   - Apenas administradores e líderes podem gerenciar líderes

4. **Validações:**
   - O `shelterId` deve existir antes de vincular
   - O `numberTeam` deve ser um número maior que 0
   - O `numberTeam` não deve exceder o `teamsQuantity` do abrigo (valide antes de enviar)

5. **Comportamento ao mover:**
   - Ao mover um líder de uma equipe para outra, ele é automaticamente removido da equipe anterior
   - Não é necessário fazer duas chamadas (remover + adicionar) - uma única chamada resolve

---

## 🔗 Relacionamentos

### Com Abrigos
- Líderes estão vinculados a abrigos **através de equipes**
- Um abrigo pode ter múltiplas equipes
- Cada equipe pode ter múltiplos líderes

### Com Professores
- Líderes e professores podem estar na mesma equipe
- Um líder pode ver os professores de sua equipe na resposta (`shelter.teachers`)

### Com Usuários
- Cada perfil de líder está vinculado a **1 usuário**
- O usuário deve existir antes de criar o perfil
- O perfil é criado automaticamente quando um usuário é marcado como líder

---

**Última atualização:** 2024-12-06

