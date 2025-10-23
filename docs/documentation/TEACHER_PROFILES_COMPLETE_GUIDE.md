# 👨‍🏫 Guia Completo do Módulo Teacher Profiles

> **Documentação Consolidada e Completa**  
> Última atualização: Outubro 2025  
> Versão da API: 1.2.0

---

## 📑 Índice

1. [Visão Geral](#visão-geral)
2. [Conceitos Básicos](#conceitos-básicos)
3. [Estrutura de Dados](#estrutura-de-dados)
4. [Autenticação e Autorização](#autenticação-e-autorização)
5. [Endpoints da API](#endpoints-da-api)
6. [Filtros e Ordenação](#filtros-e-ordenação)
7. [Vinculação com Shelters](#vinculação-com-shelters)
8. [DTOs e Validações](#dtos-e-validações)
9. [Relacionamentos](#relacionamentos)
10. [Guia de Uso - Backend](#guia-de-uso---backend)
11. [Guia de Uso - Frontend](#guia-de-uso---frontend)
12. [Collection Postman](#collection-postman)
13. [Automações e Testes](#automações-e-testes)
14. [Troubleshooting](#troubleshooting)
15. [Histórico de Mudanças](#histórico-de-mudanças)

---

## Visão Geral

O módulo **Teacher Profiles** gerencia os perfis dos professores no sistema de orfanato, incluindo vinculação com shelters (abrigos) e gerenciamento de responsabilidades.

### Características Principais

- ✅ **Criação Automática**: Teacher profiles são criados automaticamente quando um usuário com role `teacher` é criado
- ✅ **Vinculação com Shelters**: Teachers podem ser vinculados a shelters específicos
- ✅ **Listagem Avançada**: Paginação, filtros e busca flexível
- ✅ **Controle de Visibilidade**: Baseado em `user.active` e `teacherProfile.active`
- ✅ **Relacionamentos**: Com Users, Shelters e Leaders
- ✅ **Autenticação**: Bearer Token JWT
- ✅ **Autorização**: Baseada em roles (admin, coordinator, teacher)

---

## Conceitos Básicos

### O que é um Teacher Profile?

Um **Teacher Profile** representa o perfil de um professor no sistema. Cada profile contém:

- **Vinculação com User**: Relacionamento 1:1 com a entidade User
- **Vinculação com Shelter**: Relacionamento N:1 com a entidade Shelter (opcional)
- **Status Ativo**: Controle de visibilidade do professor
- **Timestamps**: Datas de criação e atualização

### Criação Automática

Os teacher profiles são **criados automaticamente** pela orquestração do módulo Users quando:
- Um usuário é criado com `role: 'teacher'`
- Um usuário existente tem seu role alterado para `teacher`

### Vinculação com Shelters

- Um teacher pode estar vinculado a **apenas um shelter por vez**
- A vinculação é gerenciada pelos endpoints `assign-shelter` e `unassign-shelter`
- Apenas admins podem vincular/desvincular teachers

---

## Estrutura de Dados

### TeacherProfileEntity

```typescript
{
  id: string;                           // UUID único
  active: boolean;                      // Status ativo/inativo
  shelter?: ShelterEntity | null;       // Shelter vinculado (opcional)
  user: UserEntity;                     // Usuário vinculado (obrigatório)
  createdAt: Date;                      // Data de criação
  updatedAt: Date;                      // Data de atualização
}
```

### Campos da Entidade

| Campo | Tipo | Nullable | Descrição |
|-------|------|----------|-----------|
| `id` | UUID | Não | Identificador único |
| `active` | boolean | Não | Status ativo (padrão: true) |
| `shelter_id` | UUID | Sim | ID do shelter vinculado |
| `user_id` | UUID | Não | ID do usuário vinculado |
| `createdAt` | timestamp | Não | Data de criação |
| `updatedAt` | timestamp | Não | Data de atualização |

---

## Autenticação e Autorização

### Autenticação

Todos os endpoints requerem autenticação via **Bearer Token JWT**:

```http
Authorization: Bearer {{access_token}}
Content-Type: application/json
```

### Autorização (Roles)

| Role | Permissões |
|------|------------|
| **admin** | Acesso total: listar, vincular/desvincular shelters |
| **coordinator** (leader) | Pode ver apenas teachers dos seus shelters |
| **teacher** | Pode ver apenas os próprios dados |

---

## Endpoints da API

### 1. Listar Teacher Profiles (Paginação)

**Endpoint**: `GET /teacher-profiles`

Lista todos os teacher profiles com paginação e filtros opcionais.

#### Parâmetros de Query

| Parâmetro | Tipo | Obrigatório | Padrão | Descrição |
|-----------|------|-------------|--------|-----------|
| `page` | number | Não | 1 | Número da página |
| `limit` | number | Não | 12 | Itens por página (máx: 100) |
| `sort` | string | Não | `updatedAt` | Campo para ordenação |
| `order` | string | Não | `desc` | Ordem (`asc`, `desc`) |
| `q` | string | Não | - | Busca por nome, email, telefone |
| `searchString` | string | Não | - | Termo de busca alternativo |
| `hasShelter` | boolean | Não | - | Filtrar por teachers com/sem shelter |
| `active` | boolean | Não | - | Filtrar por teachers ativos/inativos |
| `shelterId` | UUID | Não | - | Filtrar por shelter específico |

#### Exemplo de Requisição

```http
GET /teacher-profiles?page=1&limit=10&sort=name&order=asc&active=true
Authorization: Bearer {{access_token}}
```

#### Exemplo de Resposta (200 OK)

```json
{
  "items": [
    {
      "id": "6ee8970b-ebbb-4bef-af5a-714683e24196",
      "active": true,
      "user": {
        "id": "f3d415c7-25e4-4ec3-abb9-4d439310b8a2",
        "name": "João Silva",
        "email": "joao.silva@example.com",
        "phone": "+5511999999999",
        "active": true,
        "completed": true,
        "commonUser": false
      },
      "shelter": {
        "id": "29369713-25c4-436f-8c9e-138b3560a175",
        "name": "Abrigo Barra da Tijuca",
        "leader": {
          "id": "abc123-def456-ghi789",
          "active": true,
          "user": {
            "id": "leader-user-id",
            "name": "Maria Santos",
            "email": "maria@example.com",
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
  "total": 41,
  "page": 1,
  "limit": 10
}
```

---

### 2. Listar Teacher Profiles (Simples)

**Endpoint**: `GET /teacher-profiles/simple`

Lista teacher profiles em formato simplificado, ideal para dropdowns e seleções.

#### Exemplo de Requisição

```http
GET /teacher-profiles/simple
Authorization: Bearer {{access_token}}
```

#### Exemplo de Resposta (200 OK)

```json
[
  {
    "id": "6ee8970b-ebbb-4bef-af5a-714683e24196",
    "active": true,
    "user": {
      "id": "f3d415c7-25e4-4ec3-abb9-4d439310b8a2",
      "name": "João Silva",
      "email": "joao.silva@example.com",
      "active": true
    },
    "shelter": {
      "id": "29369713-25c4-436f-8c9e-138b3560a175",
      "name": "Abrigo Barra da Tijuca"
    }
  },
  {
    "id": "7ff8970b-ebbb-4bef-af5a-714683e24197",
    "active": true,
    "user": {
      "id": "g4d415c7-25e4-4ec3-abb9-4d439310b8a3",
      "name": "Maria Oliveira",
      "email": "maria.oliveira@example.com",
      "active": true
    },
    "shelter": null
  }
]
```

---

### 3. Buscar Teacher Profile por ID

**Endpoint**: `GET /teacher-profiles/:id`

Busca um teacher profile específico por ID.

#### Parâmetros de Path

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `id` | UUID | Sim | ID do teacher profile |

#### Exemplo de Requisição

```http
GET /teacher-profiles/6ee8970b-ebbb-4bef-af5a-714683e24196
Authorization: Bearer {{access_token}}
```

#### Exemplo de Resposta (200 OK)

```json
{
  "id": "6ee8970b-ebbb-4bef-af5a-714683e24196",
  "active": true,
  "user": {
    "id": "f3d415c7-25e4-4ec3-abb9-4d439310b8a2",
    "name": "João Silva",
    "email": "joao.silva@example.com",
    "phone": "+5511999999999",
    "active": true,
    "completed": true,
    "commonUser": false
  },
  "shelter": {
    "id": "29369713-25c4-436f-8c9e-138b3560a175",
    "name": "Abrigo Barra da Tijuca",
    "leader": {
      "id": "abc123-def456-ghi789",
      "active": true,
      "user": {
        "id": "leader-user-id",
        "name": "Maria Santos",
        "email": "maria@example.com",
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

#### Resposta de Erro (404 Not Found)

```json
{
  "statusCode": 404,
  "message": "TeacherProfile não encontrado",
  "error": "Not Found"
}
```

---

### 4. Buscar Teachers por Shelter

**Endpoint**: `GET /teacher-profiles/by-shelter/:shelterId`

Busca todos os teachers vinculados a um shelter específico.

#### Parâmetros de Path

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `shelterId` | UUID | Sim | ID do shelter |

#### Exemplo de Requisição

```http
GET /teacher-profiles/by-shelter/29369713-25c4-436f-8c9e-138b3560a175
Authorization: Bearer {{access_token}}
```

#### Exemplo de Resposta (200 OK)

```json
[
  {
    "id": "6ee8970b-ebbb-4bef-af5a-714683e24196",
    "active": true,
    "user": {
      "id": "f3d415c7-25e4-4ec3-abb9-4d439310b8a2",
      "name": "João Silva",
      "email": "joao.silva@example.com",
      "phone": "+5511999999999",
      "active": true,
      "completed": true,
      "commonUser": false
    },
    "shelter": {
      "id": "29369713-25c4-436f-8c9e-138b3560a175",
      "name": "Abrigo Barra da Tijuca",
      "leader": {
        "id": "abc123-def456-ghi789",
        "active": true,
        "user": {
          "id": "leader-user-id",
          "name": "Maria Santos",
          "email": "maria@example.com",
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

---

### 5. Vincular Teacher a Shelter

**Endpoint**: `PATCH /teacher-profiles/:teacherId/assign-shelter`

Vincula um teacher a um shelter específico.

⚠️ **Permissão**: Apenas admins podem vincular teachers.

#### Parâmetros de Path

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `teacherId` | UUID | Sim | ID do teacher profile |

#### Request Body

```json
{
  "shelterId": "29369713-25c4-436f-8c9e-138b3560a175"
}
```

#### Exemplo de Requisição

```http
PATCH /teacher-profiles/6ee8970b-ebbb-4bef-af5a-714683e24196/assign-shelter
Authorization: Bearer {{access_token}}
Content-Type: application/json

{
  "shelterId": "29369713-25c4-436f-8c9e-138b3560a175"
}
```

#### Exemplo de Resposta (200 OK)

```json
{
  "message": "Teacher atribuído ao shelter com sucesso"
}
```

#### Resposta de Erro (400 Bad Request)

```json
{
  "statusCode": 400,
  "message": "Teacher já está vinculado a outro Shelter",
  "error": "Bad Request"
}
```

---

### 6. Desvincular Teacher de Shelter

**Endpoint**: `PATCH /teacher-profiles/:teacherId/unassign-shelter`

Remove a vinculação de um teacher com um shelter.

⚠️ **Permissão**: Apenas admins podem desvincular teachers.

#### Parâmetros de Path

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `teacherId` | UUID | Sim | ID do teacher profile |

#### Request Body

```json
{
  "shelterId": "29369713-25c4-436f-8c9e-138b3560a175"
}
```

#### Exemplo de Requisição

```http
PATCH /teacher-profiles/6ee8970b-ebbb-4bef-af5a-714683e24196/unassign-shelter
Authorization: Bearer {{access_token}}
Content-Type: application/json

{
  "shelterId": "29369713-25c4-436f-8c9e-138b3560a175"
}
```

#### Exemplo de Resposta (200 OK)

```json
{
  "message": "Teacher removido do shelter com sucesso"
}
```

---

## Filtros e Ordenação

### Exemplos Práticos de Filtros

#### Buscar Teachers com Shelter

```http
GET /teacher-profiles?hasShelter=true&active=true&page=1&limit=10
```

#### Buscar Teachers sem Shelter

```http
GET /teacher-profiles?hasShelter=false&active=true
```

#### Buscar por Nome/Email/Telefone

```http
GET /teacher-profiles?q=João&sort=name&order=asc
```

#### Buscar por Shelter Específico

```http
GET /teacher-profiles?shelterId=29369713-25c4-436f-8c9e-138b3560a175
```

#### Buscar Teachers Inativos

```http
GET /teacher-profiles?active=false
```

#### Filtros Combinados

```http
GET /teacher-profiles?hasShelter=true&active=true&q=Silva&sort=name&order=asc&page=1&limit=5
```

### Ordenação

#### Ordenar por Nome do Usuário

```http
GET /teacher-profiles?sort=name&order=asc
```

#### Ordenar por Data de Criação

```http
GET /teacher-profiles?sort=createdAt&order=desc
```

#### Ordenar por Data de Atualização

```http
GET /teacher-profiles?sort=updatedAt&order=desc
```

---

## Vinculação com Shelters

### Regras de Vinculação

1. **Um Teacher por Vez**: Um teacher só pode estar vinculado a **um shelter por vez**
2. **Apenas Admins**: Somente admins podem vincular/desvincular teachers
3. **Validação de IDs**: Os IDs de teacher e shelter devem existir e ser válidos
4. **Status Ativo**: Apenas teachers ativos podem ser vinculados

### Fluxo de Vinculação

```
1. Admin seleciona teacher sem shelter
2. Admin seleciona shelter disponível
3. Sistema valida IDs e status
4. Sistema cria vinculação
5. Teacher agora pertence ao shelter
```

### Fluxo de Desvinculação

```
1. Admin seleciona teacher vinculado
2. Admin confirma desvinculação
3. Sistema remove vinculação
4. Teacher agora está sem shelter
```

---

## DTOs e Validações

### AssignShelterDto

```typescript
export class AssignShelterDto {
  @IsUUID()
  @IsNotEmpty()
  shelterId!: string;
}
```

### UnassignShelterDto

```typescript
export class UnassignShelterDto {
  @IsUUID()
  @IsNotEmpty()
  shelterId!: string;
}
```

### QueryTeacherProfileDto

```typescript
export class QueryTeacherProfileDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsString()
  searchString?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  hasShelter?: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  active?: boolean;

  @IsOptional()
  @IsUUID()
  shelterId?: string;

  @IsOptional()
  @IsString()
  @IsIn(['name', 'createdAt', 'updatedAt'])
  sort?: string = 'updatedAt';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  order?: 'asc' | 'desc' = 'desc';

  @Transform(({ value }) => Number(value))
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @Transform(({ value }) => Number(value))
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 12;
}
```

### TeacherProfileResponseDto

```typescript
export class TeacherProfileResponseDto {
  @Expose() id!: string;
  @Expose() active!: boolean;

  @Expose()
  @Type(() => UserSimpleDto)
  user!: UserSimpleDto;

  @Expose()
  @Type(() => ShelterWithLeaderDto)
  shelter?: ShelterWithLeaderDto | null;

  @Expose() createdAt!: Date;
  @Expose() updatedAt!: Date;
}
```

---

## Relacionamentos

### 1. User (One-to-One)

Cada teacher profile está vinculado a **um** usuário.

**Tipo**: One-to-One  
**Campo**: `user_id` (obrigatório)  
**Cascade**: onDelete CASCADE (se user for deletado, teacher profile também é)

```typescript
@OneToOne(() => UserEntity, { eager: true, onDelete: 'CASCADE' })
@JoinColumn({ name: 'user_id' })
user!: UserEntity;
```

### 2. Shelter (Many-to-One)

Cada teacher profile pode estar vinculado a **um** shelter.

**Tipo**: Many-to-One  
**Campo**: `shelter_id` (opcional)  
**Cascade**: onDelete SET NULL (se shelter for deletado, vinculação é removida)

```typescript
@ManyToOne(() => ShelterEntity, { eager: true, nullable: true, onDelete: 'SET NULL' })
@JoinColumn({ name: 'shelter_id' })
shelter?: ShelterEntity | null;
```

### 3. Leader (via Shelter)

Cada shelter tem **um** leader profile.

**Tipo**: Relação indireta via Shelter  
**Acesso**: `teacherProfile.shelter.leader`

---

## Guia de Uso - Backend

### Arquitetura do Módulo

```
src/modules/teacher-profiles/
├── entities/
│   └── teacher-profile.entity.ts        # Entidade TypeORM
├── dto/
│   ├── assign-shelter.dto.ts            # DTO para vincular
│   ├── unassign-shelter.dto.ts          # DTO para desvincular
│   ├── query-teacher-profile.dto.ts     # DTO para queries/filtros
│   └── teacher-profile-response.dto.ts  # DTO para resposta
├── repositories/
│   └── teacher-profiles.repository.ts   # Repository pattern
├── services/
│   └── teacher-profiles.service.ts      # Lógica de negócio
├── controller/
│   └── teacher-profiles.controller.ts   # Controller REST
└── teacher-profiles.module.ts           # Módulo NestJS
```

### Importar o Módulo

```typescript
import { TeacherProfilesModule } from './modules/teacher-profiles/teacher-profiles.module';

@Module({
  imports: [
    // ... outros módulos
    TeacherProfilesModule,
  ],
})
export class AppModule {}
```

### Usar o Repository

```typescript
import { TeacherProfilesRepository } from './modules/teacher-profiles/repositories/teacher-profiles.repository';

@Injectable()
export class MeuService {
  constructor(
    private readonly teacherProfilesRepository: TeacherProfilesRepository,
  ) {}

  async listarTeachers() {
    return await this.teacherProfilesRepository.findAllPaginated({
      page: 1,
      limit: 10,
    });
  }
}
```

### Busca com Filtros

```typescript
const resultado = await this.teacherProfilesRepository.findAllPaginated({
  page: 1,
  limit: 20,
  q: 'João',
  hasShelter: true,
  active: true,
  sort: 'name',
  order: 'asc',
});
```

### Vincular Teacher a Shelter

```typescript
await this.teacherProfilesService.assignShelter(teacherId, {
  shelterId: 'shelter-uuid',
});
```

---

## Guia de Uso - Frontend

### Listar Teacher Profiles (React/TypeScript)

```typescript
import axios from 'axios';

interface TeacherProfile {
  id: string;
  active: boolean;
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    active: boolean;
  };
  shelter?: {
    id: string;
    name: string;
    leader?: {
      id: string;
      user: {
        name: string;
        email: string;
      };
    };
  } | null;
}

interface PaginatedResponse {
  items: TeacherProfile[];
  total: number;
  page: number;
  limit: number;
}

async function fetchTeacherProfiles(
  page: number = 1,
  limit: number = 12,
  filters?: {
    q?: string;
    hasShelter?: boolean;
    active?: boolean;
    shelterId?: string;
  }
): Promise<PaginatedResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...filters,
  });

  const response = await axios.get<PaginatedResponse>(
    `/teacher-profiles?${params}`,
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('access_token')}`,
      },
    }
  );

  return response.data;
}

// Uso
const resultado = await fetchTeacherProfiles(1, 10, {
  q: 'João',
  hasShelter: true,
  active: true,
});
```

### Vincular Teacher a Shelter

```typescript
async function assignTeacherToShelter(
  teacherId: string,
  shelterId: string
): Promise<{ message: string }> {
  const response = await axios.patch(
    `/teacher-profiles/${teacherId}/assign-shelter`,
    { shelterId },
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        'Content-Type': 'application/json',
      },
    }
  );

  return response.data;
}

// Uso
await assignTeacherToShelter('teacher-uuid', 'shelter-uuid');
```

### Desvincular Teacher de Shelter

```typescript
async function unassignTeacherFromShelter(
  teacherId: string,
  shelterId: string
): Promise<{ message: string }> {
  const response = await axios.patch(
    `/teacher-profiles/${teacherId}/unassign-shelter`,
    { shelterId },
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        'Content-Type': 'application/json',
      },
    }
  );

  return response.data;
}

// Uso
await unassignTeacherFromShelter('teacher-uuid', 'shelter-uuid');
```

### Componente de Lista (React)

```tsx
import React, { useState, useEffect } from 'react';

const TeacherProfilesList: React.FC = () => {
  const [teachers, setTeachers] = useState<TeacherProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadTeachers();
  }, [page]);

  const loadTeachers = async () => {
    setLoading(true);
    try {
      const response = await fetchTeacherProfiles(page, 10, {
        active: true,
      });
      setTeachers(response.items);
      setTotal(response.total);
    } catch (error) {
      console.error('Erro ao carregar teachers:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Carregando...</div>;

  return (
    <div>
      <h1>Teacher Profiles</h1>
      <ul>
        {teachers.map((t) => (
          <li key={t.id}>
            <strong>{t.user.name}</strong> - {t.user.email}
            {t.shelter && <span> (Shelter: {t.shelter.name})</span>}
            {!t.shelter && <span> (Sem shelter)</span>}
          </li>
        ))}
      </ul>
      
      <div>
        <button 
          disabled={page === 1} 
          onClick={() => setPage(page - 1)}
        >
          Anterior
        </button>
        <span>Página {page}</span>
        <button 
          disabled={teachers.length < 10} 
          onClick={() => setPage(page + 1)}
        >
          Próxima
        </button>
      </div>
    </div>
  );
};
```

---

## Collection Postman

### Importar Collection

1. Abra o **Postman**
2. Clique em **"Import"**
3. Selecione o arquivo `Teacher_Profiles_API_Collection.postman_collection.json`
4. Configure as variáveis de ambiente

### Variáveis de Ambiente

Configure as seguintes variáveis no Postman:

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `base_url` | URL base da API | `http://localhost:3000` |
| `access_token` | Token JWT de autenticação | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `teacher_profile_id` | ID de exemplo para testes | `6ee8970b-ebbb-4bef-af5a-714683e24196` |
| `shelter_id` | ID de shelter para testes | `29369713-25c4-436f-8c9e-138b3560a175` |

### Estrutura da Collection

A collection contém os seguintes requests:

1. **Listar Teacher Profiles (Paginação)** - GET
2. **Listar Teacher Profiles Simples** - GET
3. **Buscar Teacher Profile por ID** - GET
4. **Buscar Teachers por Shelter** - GET
5. **Filtrar por Teachers com Shelter** - GET
6. **Filtrar por Teachers sem Shelter** - GET
7. **Buscar por Termo** - GET
8. **Vincular Teacher a Shelter** - PATCH
9. **Desvincular Teacher de Shelter** - PATCH

---

## Automações e Testes

### Scripts Disponíveis

#### 1. Teste Completo de Automação

**Arquivo**: `tests/teacher-profiles/test-teacher-profiles-complete-automation.js`

**Funcionalidade**:
- Testa todos os endpoints
- Valida filtros e paginação
- Testa vinculação/desvinculação

**Executar**:
```bash
node tests/teacher-profiles/test-teacher-profiles-complete-automation.js
```

**Resultado Esperado**:
```
✅ 41 teacher profiles encontrados
✅ Todos os endpoints testados com sucesso
✅ Filtros funcionando perfeitamente
```

#### 2. Teste de Vinculação

**Arquivo**: `tests/teacher-profiles/test-teacher-shelter-linking.js`

**Testes Incluídos**:
- ✅ Listar shelters disponíveis
- ✅ Listar teacher profiles
- ✅ Vincular teacher a shelter
- ✅ Desvincular teacher de shelter

**Executar**:
```bash
node tests/teacher-profiles/test-teacher-shelter-linking.js
```

---

## Troubleshooting

### Erro 400 - Bad Request

**Sintoma**: Requisição rejeitada com erro de validação

**Possíveis Causas**:
- UUID inválido para `shelterId`
- Teacher já vinculado a outro shelter
- Campo `shelterId` ausente

**Solução**:
```json
{
  "shelterId": "29369713-25c4-436f-8c9e-138b3560a175"
}
```

---

### Erro 401 - Unauthorized

**Sintoma**: Acesso negado com mensagem "Unauthorized"

**Possíveis Causas**:
- Token JWT ausente ou inválido
- Token expirado
- Header `Authorization` mal formatado

**Solução**:
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

### Erro 403 - Forbidden

**Sintoma**: Acesso negado mesmo com token válido

**Possíveis Causas**:
- Role do usuário não tem permissão
- Teacher tentando vincular/desvincular (apenas admins)

**Solução**:
- Usar conta admin para vincular/desvincular
- Leaders só podem ver teachers dos seus shelters

---

### Erro 404 - Not Found

**Sintoma**: Recurso não encontrado

**Possíveis Causas**:
- ID do teacher profile não existe
- ID do shelter não existe
- Teacher inativo ou deletado

**Solução**:
- Verificar se o ID é válido e existe no banco
- Confirmar que o teacher está ativo
- Listar todos os teacher profiles para verificar IDs disponíveis

---

### Problema: Teacher Não Aparece na Listagem

**Sintoma**: Teacher existe mas não aparece nos resultados

**Diagnóstico**: Verificar se `user.active` e `teacherProfile.active` estão true

**Solução**:
```sql
-- Verificar status
SELECT * FROM teacher_profiles WHERE id = 'teacher-uuid';
SELECT * FROM users WHERE id = 'user-uuid';

-- Ativar se necessário
UPDATE teacher_profiles SET active = true WHERE id = 'teacher-uuid';
UPDATE users SET active = true WHERE id = 'user-uuid';
```

---

### Problema: Erro ao Vincular Teacher

**Sintoma**: Erro "Teacher já está vinculado a outro Shelter"

**Diagnóstico**: Teacher já tem um shelter vinculado

**Solução**:
1. Desvincular do shelter atual primeiro
2. Depois vincular ao novo shelter

```bash
# 1. Desvincular
PATCH /teacher-profiles/:id/unassign-shelter
{ "shelterId": "shelter-atual-id" }

# 2. Vincular
PATCH /teacher-profiles/:id/assign-shelter
{ "shelterId": "novo-shelter-id" }
```

---

## Histórico de Mudanças

### v1.2.0 - Refatoração para Shelters (Setembro 2025)

**Mudanças**:
- ✅ Renomeado `club` para `shelter` em todos os endpoints
- ✅ Atualizado `clubId` para `shelterId` nos DTOs
- ✅ Corrigido relacionamentos no repository
- ✅ Atualizada collection do Postman
- ✅ Atualizada documentação

**Impacto**:
- ⚠️ **Breaking Change**: Endpoints e campos renomeados
- ✅ Compatibilidade com novo módulo Shelters
- ✅ Melhor clareza e consistência

---

### v1.1.0 - Funcionalidades Básicas (Setembro 2025)

**Funcionalidades**:
- ✅ CRUD completo de teacher profiles
- ✅ Vinculação com shelters
- ✅ Paginação e filtros
- ✅ Autenticação JWT
- ✅ Autorização por roles
- ✅ Criação automática via orquestração Users

---

## Códigos de Status HTTP

| Código | Descrição | Quando Ocorre |
|--------|-----------|---------------|
| **200** | OK | Operação realizada com sucesso (GET, PATCH) |
| **400** | Bad Request | Dados inválidos, validação falhou |
| **401** | Unauthorized | Token de autenticação inválido ou ausente |
| **403** | Forbidden | Acesso negado (sem permissão) |
| **404** | Not Found | Recurso não encontrado |
| **500** | Internal Server Error | Erro interno do servidor |

---

## Limitações e Considerações

### Paginação
- **Máximo**: 100 itens por página
- **Padrão**: 12 itens por página

### Vinculação
- **Um Shelter**: Teacher só pode ter um shelter por vez
- **Apenas Admins**: Somente admins podem vincular/desvincular

### Visibilidade
- **user.active**: Deve ser true para aparecer
- **teacherProfile.active**: Deve ser true para aparecer

### UUIDs
- **Formato**: UUID v4
- **Validação**: Automática via class-validator

---

## Recursos Adicionais

### Arquivos Relacionados

#### Código Fonte
- `src/modules/teacher-profiles/` - Módulo completo
- `src/modules/users/` - Módulo de Users (relacionado)
- `src/modules/shelters/` - Módulo de Shelters (relacionado)

#### Documentação
- `docs/collections/Teacher_Profiles_API_Collection.postman_collection.json` - Collection Postman
- `docs/teacher-profiles/README.md` - README simplificado

#### Testes
- `tests/teacher-profiles/test-teacher-profiles-complete-automation.js`
- `tests/teacher-profiles/test-teacher-shelter-linking.js`

---

## Suporte e Contato

Para dúvidas, problemas ou sugestões:

1. **Issues**: Abra uma issue no repositório
2. **Pull Requests**: Contribuições são bem-vindas
3. **Documentação**: Sempre mantenha atualizada

---

## Licença

Este projeto segue a licença definida no repositório principal.

---

**Última Atualização**: Outubro 2025  
**Versão da API**: 1.2.0  
**Autor**: Sistema de Orfanato

---


