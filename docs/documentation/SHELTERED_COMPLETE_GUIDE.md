# 👶 Guia Completo do Módulo Sheltered

> **Documentação Consolidada e Completa**  
> Última atualização: Outubro 2025  
> Versão da API: 2.1.0

---

## 📑 Índice

1. [Visão Geral](#visão-geral)
2. [Conceitos Básicos](#conceitos-básicos)
3. [Estrutura de Dados](#estrutura-de-dados)
4. [Autenticação e Autorização](#autenticação-e-autorização)
5. [Endpoints da API](#endpoints-da-api)
6. [Filtros e Ordenação](#filtros-e-ordenação)
7. [DTOs e Validações](#dtos-e-validações)
8. [Relacionamentos](#relacionamentos)
9. [Guia de Uso - Backend](#guia-de-uso---backend)
10. [Guia de Uso - Frontend](#guia-de-uso---frontend)
11. [Collection Postman](#collection-postman)
12. [Automações e Testes](#automações-e-testes)
13. [Troubleshooting](#troubleshooting)
14. [Histórico de Mudanças](#histórico-de-mudanças)

---

## Visão Geral

O módulo **Sheltered** gerencia as crianças/adolescentes abrigados no sistema de orfanato, incluindo dados pessoais, informações dos responsáveis (opcionais) e vinculação com abrigos (shelters).

### Características Principais

- ✅ **CRUD Completo**: Create, Read, Update, Delete
- ✅ **Paginação Avançada**: Com filtros e ordenação personalizáveis
- ✅ **Busca Flexível**: Por nome, responsável, cidade, estado, etc.
- ✅ **Campos Opcionais**: `guardianName` e `guardianPhone` são opcionais
- ✅ **Relacionamentos**: Com Shelters, Endereços, Pagelas e AcceptedChrists
- ✅ **Validações**: Automáticas para todos os campos
- ✅ **Autenticação**: Bearer Token JWT
- ✅ **Autorização**: Baseada em roles (admin, coordinator, teacher)

---

## Conceitos Básicos

### O que é um Sheltered?

Um **Sheltered** representa uma criança ou adolescente abrigado no sistema. Cada registro contém:

- **Dados Pessoais**: Nome, data de nascimento, gênero
- **Responsável** (Opcional): Nome e telefone do guardião/tutor
- **Endereço** (Opcional): Endereço completo com CEP
- **Vinculação**: Shelter onde está abrigado (opcional)
- **Datas**: Data de ingresso no abrigo

### ⚠️ Campos Opcionais Importantes

Os campos `guardianName` e `guardianPhone` são **opcionais**, permitindo registrar crianças sem responsável legal ou com responsável desconhecido.

---

## Estrutura de Dados

### ShelteredEntity

```typescript
{
  id: string;                           // UUID único
  name: string;                         // Nome completo (obrigatório)
  birthDate: string;                    // Data de nascimento (YYYY-MM-DD)
  guardianName?: string | null;         // Nome do responsável (opcional)
  gender: string;                       // Gênero (obrigatório)
  guardianPhone?: string | null;        // Telefone do responsável (opcional)
  joinedAt?: string | null;             // Data de ingresso no abrigo
  shelter?: ShelterEntity | null;       // Relacionamento com Shelter
  address?: AddressEntity | null;       // Relacionamento com Address
  acceptedChrists?: AcceptedChrist[];   // Aceitação de Cristo (array)
  pagelas?: PagelaEntity[];             // Páginas relacionadas (array)
  createdAt: Date;                      // Data de criação
  updatedAt: Date;                      // Data de atualização
}
```

### Campos Obrigatórios vs Opcionais

#### ✅ Campos Obrigatórios

| Campo | Tipo | Validação | Descrição |
|-------|------|-----------|-----------|
| `name` | string | 2-255 caracteres | Nome completo da criança |
| `birthDate` | string | YYYY-MM-DD | Data de nascimento |
| `gender` | string | 2-255 caracteres | Gênero |

#### 🔓 Campos Opcionais

| Campo | Tipo | Validação | Descrição |
|-------|------|-----------|-----------|
| `guardianName` | string \| null | 2-255 caracteres | Nome do responsável |
| `guardianPhone` | string \| null | 5-32 caracteres | Telefone do responsável |
| `joinedAt` | string \| null | YYYY-MM-DD | Data de ingresso |
| `shelterId` | string \| null | UUID válido | ID do shelter |
| `address` | object \| null | Validação complexa | Endereço completo |

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
| **admin** | Acesso total a todos os sheltered |
| **coordinator** (leader) | Acesso aos sheltered dos seus shelters |
| **teacher** | Acesso aos sheltered dos shelters onde trabalha |

---

## Endpoints da API

### 1. Listar Sheltered (Paginação)

**Endpoint**: `GET /sheltered`

Lista todos os sheltered com paginação e filtros opcionais.

#### Parâmetros de Query

| Parâmetro | Tipo | Obrigatório | Padrão | Descrição |
|-----------|------|-------------|--------|-----------|
| `page` | number | Não | 1 | Número da página |
| `limit` | number | Não | 20 | Itens por página (máx: 100) |
| `orderBy` | string | Não | `createdAt` | Campo para ordenação |
| `order` | string | Não | `ASC` | Ordem (`ASC`, `DESC`) |
| `searchString` | string | Não | - | Busca geral por nome ou responsável |
| `shelterId` | string | Não | - | Filtrar por ID do shelter |
| `shelterName` | string | Não | - | Filtrar por nome do shelter |
| `city` | string | Não | - | Filtrar por cidade |
| `state` | string | Não | - | Filtrar por estado |
| `gender` | string | Não | - | Filtrar por gênero |
| `birthDate` | string | Não | - | Filtrar por data de nascimento específica |
| `birthDateFrom` | string | Não | - | Filtrar por data a partir de |
| `birthDateTo` | string | Não | - | Filtrar por data até |
| `joinedAt` | string | Não | - | Filtrar por data de ingresso específica |
| `joinedFrom` | string | Não | - | Filtrar por data de ingresso a partir de |
| `joinedTo` | string | Não | - | Filtrar por data de ingresso até |

#### Exemplo de Requisição

```http
GET /sheltered?page=1&limit=5&orderBy=name&order=ASC&gender=Feminino
Authorization: Bearer {{access_token}}
```

#### Exemplo de Resposta (200 OK)

```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Ana Silva",
      "birthDate": "2010-05-15",
      "guardianName": "Maria Silva",
      "gender": "Feminino",
      "guardianPhone": "+5511999999999",
      "joinedAt": "2024-01-15",
      "shelter": {
        "id": "660e8400-e29b-41d4-a716-446655440000",
        "name": "Abrigo Central"
      },
      "address": {
        "id": "770e8400-e29b-41d4-a716-446655440000",
        "street": "Rua das Flores",
        "number": "123",
        "district": "Centro",
        "city": "São Paulo",
        "state": "SP",
        "postalCode": "01234-567",
        "complement": "Apto 45"
      },
      "createdAt": "2025-09-27T21:00:00.000Z",
      "updatedAt": "2025-09-27T21:00:00.000Z"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "João Sem Responsável",
      "birthDate": "2012-03-20",
      "guardianName": null,
      "gender": "Masculino",
      "guardianPhone": null,
      "joinedAt": "2024-02-01",
      "shelter": {
        "id": "660e8400-e29b-41d4-a716-446655440001",
        "name": "Abrigo Jardins"
      },
      "address": {
        "id": "770e8400-e29b-41d4-a716-446655440001",
        "street": "Rua Sem Responsável",
        "number": "456",
        "district": "Jardins",
        "city": "Rio de Janeiro",
        "state": "RJ",
        "postalCode": "20000-000",
        "complement": "Casa 2"
      },
      "createdAt": "2025-09-27T21:00:00.000Z",
      "updatedAt": "2025-09-27T21:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 5,
    "totalItems": 20,
    "totalPages": 4,
    "orderBy": "name",
    "order": "ASC"
  }
}
```

---

### 2. Listar Sheltered Simples

**Endpoint**: `GET /sheltered/simple`

Lista todos os sheltered em formato simplificado, ideal para dropdowns e seleções.

#### Exemplo de Requisição

```http
GET /sheltered/simple
Authorization: Bearer {{access_token}}
```

#### Exemplo de Resposta (200 OK)

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Ana Silva",
    "guardianName": "Maria Silva",
    "gender": "Feminino",
    "guardianPhone": "+5511999999999",
    "shelterId": "660e8400-e29b-41d4-a716-446655440000",
    "acceptedChrists": []
  },
  {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "name": "Bruno Santos",
    "guardianName": "João Santos",
    "gender": "Masculino",
    "guardianPhone": "+5511888888888",
    "shelterId": "660e8400-e29b-41d4-a716-446655440001",
    "acceptedChrists": []
  }
]
```

---

### 3. Buscar Sheltered por ID

**Endpoint**: `GET /sheltered/:id`

Busca um sheltered específico por ID.

#### Parâmetros de Path

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `id` | string | Sim | UUID do sheltered |

#### Exemplo de Requisição

```http
GET /sheltered/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer {{access_token}}
```

#### Exemplo de Resposta (200 OK)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Ana Silva",
  "birthDate": "2010-05-15",
  "guardianName": "Maria Silva",
  "gender": "Feminino",
  "guardianPhone": "+5511999999999",
  "joinedAt": "2024-01-15",
  "shelter": {
    "id": "660e8400-e29b-41d4-a716-446655440000",
    "name": "Abrigo Central"
  },
  "address": {
    "id": "770e8400-e29b-41d4-a716-446655440000",
    "street": "Rua das Flores",
    "number": "123",
    "district": "Centro",
    "city": "São Paulo",
    "state": "SP",
    "postalCode": "01234-567",
    "complement": "Apto 45"
  },
  "createdAt": "2025-09-27T21:00:00.000Z",
  "updatedAt": "2025-09-27T21:00:00.000Z"
}
```

#### Resposta de Erro (404 Not Found)

```json
{
  "statusCode": 404,
  "message": "Sheltered não encontrado",
  "error": "Not Found"
}
```

---

### 4. Criar Sheltered

**Endpoint**: `POST /sheltered`

Cria um novo sheltered.

#### Exemplo de Requisição (Com Responsável)

```http
POST /sheltered
Authorization: Bearer {{access_token}}
Content-Type: application/json

{
  "name": "João Silva",
  "birthDate": "2010-05-15",
  "guardianName": "Maria Silva",
  "gender": "Masculino",
  "guardianPhone": "+5511999999999",
  "joinedAt": "2024-01-15",
  "shelterId": "660e8400-e29b-41d4-a716-446655440000",
  "address": {
    "street": "Rua das Flores",
    "number": "123",
    "district": "Centro",
    "city": "São Paulo",
    "state": "SP",
    "postalCode": "01234-567",
    "complement": "Apto 45"
  }
}
```

#### Exemplo de Requisição (Sem Responsável)

```http
POST /sheltered
Authorization: Bearer {{access_token}}
Content-Type: application/json

{
  "name": "João Sem Responsável",
  "birthDate": "2012-03-20",
  "gender": "Masculino",
  "joinedAt": "2024-02-01",
  "address": {
    "street": "Rua Sem Responsável",
    "number": "456",
    "district": "Jardins",
    "city": "Rio de Janeiro",
    "state": "RJ",
    "postalCode": "20000-000",
    "complement": "Casa 2"
  }
}
```

#### Exemplo de Resposta (201 Created)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440002",
  "name": "João Silva",
  "birthDate": "2010-05-15",
  "guardianName": "Maria Silva",
  "gender": "Masculino",
  "guardianPhone": "+5511999999999",
  "joinedAt": "2024-01-15",
  "shelter": {
    "id": "660e8400-e29b-41d4-a716-446655440000",
    "name": "Abrigo Central"
  },
  "address": {
    "id": "770e8400-e29b-41d4-a716-446655440002",
    "street": "Rua das Flores",
    "number": "123",
    "district": "Centro",
    "city": "São Paulo",
    "state": "SP",
    "postalCode": "01234-567",
    "complement": "Apto 45"
  },
  "createdAt": "2025-09-27T21:00:00.000Z",
  "updatedAt": "2025-09-27T21:00:00.000Z"
}
```

#### Resposta de Erro (400 Bad Request)

```json
{
  "statusCode": 400,
  "message": [
    "name must be longer than or equal to 2 characters",
    "birthDate must be a valid ISO 8601 date string"
  ],
  "error": "Bad Request"
}
```

---

### 5. Atualizar Sheltered

**Endpoint**: `PUT /sheltered/:id`

Atualiza um sheltered existente. Todos os campos são opcionais na atualização.

#### Parâmetros de Path

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `id` | string | Sim | UUID do sheltered |

#### Exemplo de Requisição

```http
PUT /sheltered/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer {{access_token}}
Content-Type: application/json

{
  "name": "João Silva Santos",
  "guardianName": "Maria Silva Santos",
  "guardianPhone": "+5511888888888"
}
```

#### Exemplo de Resposta (200 OK)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "João Silva Santos",
  "birthDate": "2010-05-15",
  "guardianName": "Maria Silva Santos",
  "gender": "Masculino",
  "guardianPhone": "+5511888888888",
  "joinedAt": "2024-01-15",
  "shelter": {
    "id": "660e8400-e29b-41d4-a716-446655440000",
    "name": "Abrigo Central"
  },
  "address": {
    "id": "770e8400-e29b-41d4-a716-446655440000",
    "street": "Rua das Flores",
    "number": "123",
    "district": "Centro",
    "city": "São Paulo",
    "state": "SP",
    "postalCode": "01234-567",
    "complement": "Apto 45"
  },
  "createdAt": "2025-09-27T21:00:00.000Z",
  "updatedAt": "2025-09-27T21:30:00.000Z"
}
```

---

### 6. Deletar Sheltered

**Endpoint**: `DELETE /sheltered/:id`

Remove um sheltered do sistema.

#### Parâmetros de Path

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `id` | string | Sim | UUID do sheltered |

#### Exemplo de Requisição

```http
DELETE /sheltered/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer {{access_token}}
```

#### Exemplo de Resposta (200 OK)

```json
{}
```

---

## Filtros e Ordenação

### Exemplos Práticos de Filtros

#### Buscar por Gênero

```http
GET /sheltered?gender=Feminino&page=1&limit=10
```

#### Buscar por Shelter

```http
GET /sheltered?shelterName=Central&page=1&limit=5
```

#### Buscar por Cidade

```http
GET /sheltered?city=São Paulo&page=1&limit=10
```

#### Buscar por Faixa de Data de Nascimento

```http
GET /sheltered?birthDateFrom=2010-01-01&birthDateTo=2015-12-31&page=1&limit=10
```

#### Buscar por Faixa de Data de Ingresso

```http
GET /sheltered?joinedFrom=2024-01-01&joinedTo=2024-12-31&page=1&limit=10
```

#### Busca Geral (Nome ou Responsável)

```http
GET /sheltered?searchString=Silva&page=1&limit=10
```

### Ordenação

#### Ordenar por Nome (A-Z)

```http
GET /sheltered?orderBy=name&order=ASC
```

#### Ordenar por Data de Nascimento (Mais Novos Primeiro)

```http
GET /sheltered?orderBy=birthDate&order=DESC
```

#### Ordenar por Data de Ingresso (Mais Recentes)

```http
GET /sheltered?orderBy=joinedAt&order=DESC
```

#### Ordenar por Data de Criação

```http
GET /sheltered?orderBy=createdAt&order=DESC
```

---

## DTOs e Validações

### CreateShelteredDto

```typescript
export class CreateShelteredDto {
  @IsString()
  @Length(2, 255)
  name!: string;

  @IsDateString()
  birthDate!: string;

  @IsOptional()
  @IsString()
  @Length(2, 255)
  guardianName?: string;

  @IsString()
  @Length(2, 255)
  gender!: string;

  @IsOptional()
  @IsString()
  @Length(5, 32)
  guardianPhone?: string;

  @IsOptional()
  @IsDateString()
  joinedAt?: string;

  @IsOptional()
  @IsUUID()
  shelterId?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  address?: AddressDto;
}
```

### UpdateShelteredDto

```typescript
export class UpdateShelteredDto {
  @IsOptional()
  @IsString()
  @Length(2, 255)
  name?: string;

  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @IsOptional()
  @IsString()
  @Length(2, 255)
  guardianName?: string;

  @IsOptional()
  @IsString()
  @Length(2, 255)
  gender?: string;

  @IsOptional()
  @IsString()
  @Length(5, 32)
  guardianPhone?: string;

  @IsOptional()
  @IsDateString()
  joinedAt?: string;

  @IsOptional()
  @IsUUID()
  shelterId?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  address?: AddressDto;
}
```

### QueryShelteredDto

```typescript
export class QueryShelteredDto {
  @IsOptional()
  @IsString()
  searchString?: string;

  @IsOptional()
  @IsUUID()
  shelterId?: string;

  @IsOptional()
  @IsString()
  shelterName?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsString()
  birthDate?: string;

  @IsOptional()
  @IsString()
  birthDateFrom?: string;

  @IsOptional()
  @IsString()
  birthDateTo?: string;

  @IsOptional()
  @IsString()
  joinedAt?: string;

  @IsOptional()
  @IsString()
  joinedFrom?: string;

  @IsOptional()
  @IsString()
  joinedTo?: string;

  @IsOptional()
  @IsString()
  orderBy?: 'name' | 'birthDate' | 'joinedAt' | 'createdAt';

  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  order?: 'ASC' | 'DESC' = 'ASC';

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
  limit?: number = 20;
}
```

### ShelteredResponseDto

```typescript
export class ShelteredResponseDto {
  @Expose() id!: string;
  @Expose() name!: string;
  @Expose() birthDate!: string;
  @Expose() guardianName?: string | null;
  @Expose() gender!: string;
  @Expose() guardianPhone?: string | null;
  @Expose() joinedAt?: string | null;

  @Expose()
  @Type(() => ShelterSimpleDto)
  shelter?: ShelterSimpleDto | null;

  @Expose()
  @Type(() => AddressResponseDto)
  address?: AddressResponseDto | null;

  @Expose() createdAt!: Date;
  @Expose() updatedAt!: Date;
}
```

### AddressDto (Nested)

```typescript
export class AddressDto {
  @IsString()
  street!: string;

  @IsOptional()
  @IsString()
  number?: string;

  @IsString()
  district!: string;

  @IsString()
  city!: string;

  @IsString()
  state!: string;

  @IsString()
  postalCode!: string;

  @IsOptional()
  @IsString()
  complement?: string;
}
```

---

## Relacionamentos

### 1. Shelter (Many-to-One)

Cada sheltered pode estar vinculado a **um** shelter.

**Tipo**: Many-to-One  
**Campo**: `shelterId` (opcional)  
**Eager Loading**: Não  

```typescript
@ManyToOne(() => ShelterEntity, { eager: false, nullable: true })
@JoinColumn({ name: 'shelter_id' })
shelter?: ShelterEntity | null;
```

### 2. Address (One-to-One)

Cada sheltered pode ter **um** endereço.

**Tipo**: One-to-One  
**Campo**: `address` (opcional)  
**Cascade**: true  

```typescript
@OneToOne(() => AddressEntity, { cascade: true, eager: true, nullable: true, onDelete: 'RESTRICT' })
@JoinColumn({ name: 'address_id' })
address?: AddressEntity | null;
```

### 3. AcceptedChrists (One-to-Many)

Cada sheltered pode ter **múltiplos** registros de aceitação de Cristo.

**Tipo**: One-to-Many  
**Campo**: `acceptedChrists` (array)  

```typescript
@OneToMany(() => AcceptedChristEntity, (ac) => ac.sheltered, { cascade: false })
acceptedChrists?: AcceptedChristEntity[];
```

### 4. Pagelas (One-to-Many)

Cada sheltered pode ter **múltiplas** páginas.

**Tipo**: One-to-Many  
**Campo**: `pagelas` (array)  

```typescript
@OneToMany(() => PagelaEntity, (p) => p.sheltered, { cascade: false })
pagelas?: PagelaEntity[];
```

---

## Guia de Uso - Backend

### Arquitetura do Módulo

```
src/modules/sheltered/
├── entities/
│   └── sheltered.entity.ts           # Entidade TypeORM
├── dto/
│   ├── create-sheltered.dto.ts       # DTO para criação
│   ├── update-sheltered.dto.ts       # DTO para atualização
│   ├── query-sheltered.dto.ts        # DTO para queries/filtros
│   └── sheltered-response.dto.ts     # DTO para resposta
├── repositories/
│   └── sheltered.repository.ts       # Repository pattern
├── services/
│   ├── create-sheltered.service.ts   # Lógica de criação
│   ├── get-sheltered.service.ts      # Lógica de busca
│   ├── update-sheltered.service.ts   # Lógica de atualização
│   └── delete-sheltered.service.ts   # Lógica de deleção
├── sheltered.controller.ts           # Controller REST
└── sheltered.module.ts               # Módulo NestJS
```

### Importar o Módulo

```typescript
import { ShelteredModule } from './modules/sheltered/sheltered.module';

@Module({
  imports: [
    // ... outros módulos
    ShelteredModule,
  ],
})
export class AppModule {}
```

### Usar o Repository

```typescript
import { ShelteredRepository } from './modules/sheltered/repositories/sheltered.repository';

@Injectable()
export class MeuService {
  constructor(
    private readonly shelteredRepository: ShelteredRepository,
  ) {}

  async listarSheltered() {
    return await this.shelteredRepository.findAllPaginated({
      page: 1,
      limit: 10,
    });
  }
}
```

### Busca com Filtros

```typescript
const resultado = await this.shelteredRepository.findAllPaginated({
  page: 1,
  limit: 20,
  searchString: 'Silva',
  gender: 'Feminino',
  city: 'São Paulo',
  orderBy: 'name',
  order: 'ASC',
});
```

---

## Guia de Uso - Frontend

### Listar Sheltered (React/TypeScript)

```typescript
import axios from 'axios';

interface Sheltered {
  id: string;
  name: string;
  birthDate: string;
  guardianName?: string | null;
  gender: string;
  guardianPhone?: string | null;
  shelter?: {
    id: string;
    name: string;
  } | null;
}

interface PaginatedResponse {
  data: Sheltered[];
  meta: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}

async function fetchSheltered(
  page: number = 1,
  limit: number = 20,
  filters?: {
    searchString?: string;
    gender?: string;
    city?: string;
  }
): Promise<PaginatedResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...filters,
  });

  const response = await axios.get<PaginatedResponse>(
    `/sheltered?${params}`,
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('access_token')}`,
      },
    }
  );

  return response.data;
}

// Uso
const resultado = await fetchSheltered(1, 10, {
  searchString: 'Silva',
  gender: 'Feminino',
});
```

### Criar Sheltered

```typescript
interface CreateShelteredInput {
  name: string;
  birthDate: string;
  gender: string;
  guardianName?: string;
  guardianPhone?: string;
  joinedAt?: string;
  shelterId?: string;
  address?: {
    street: string;
    number?: string;
    district: string;
    city: string;
    state: string;
    postalCode: string;
    complement?: string;
  };
}

async function createSheltered(data: CreateShelteredInput): Promise<Sheltered> {
  const response = await axios.post<Sheltered>('/sheltered', data, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('access_token')}`,
      'Content-Type': 'application/json',
    },
  });

  return response.data;
}

// Uso
const novoSheltered = await createSheltered({
  name: 'João Silva',
  birthDate: '2010-05-15',
  gender: 'Masculino',
  guardianName: 'Maria Silva', // Opcional
  guardianPhone: '+5511999999999', // Opcional
  shelterId: 'uuid-shelter-id',
  address: {
    street: 'Rua das Flores',
    number: '123',
    district: 'Centro',
    city: 'São Paulo',
    state: 'SP',
    postalCode: '01234-567',
  },
});
```

### Atualizar Sheltered

```typescript
async function updateSheltered(
  id: string,
  data: Partial<CreateShelteredInput>
): Promise<Sheltered> {
  const response = await axios.put<Sheltered>(`/sheltered/${id}`, data, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('access_token')}`,
      'Content-Type': 'application/json',
    },
  });

  return response.data;
}

// Uso
const atualizado = await updateSheltered('uuid-sheltered', {
  guardianPhone: '+5511888888888',
});
```

### Deletar Sheltered

```typescript
async function deleteSheltered(id: string): Promise<void> {
  await axios.delete(`/sheltered/${id}`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('access_token')}`,
    },
  });
}

// Uso
await deleteSheltered('uuid-sheltered');
```

### Componente de Lista (React)

```tsx
import React, { useState, useEffect } from 'react';

const ShelteredList: React.FC = () => {
  const [sheltered, setSheltered] = useState<Sheltered[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadSheltered();
  }, [page]);

  const loadSheltered = async () => {
    setLoading(true);
    try {
      const response = await fetchSheltered(page, 10);
      setSheltered(response.data);
      setTotalPages(response.meta.totalPages);
    } catch (error) {
      console.error('Erro ao carregar sheltered:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Carregando...</div>;

  return (
    <div>
      <h1>Sheltered</h1>
      <ul>
        {sheltered.map((s) => (
          <li key={s.id}>
            <strong>{s.name}</strong> - {s.gender}
            {s.guardianName && <span> (Responsável: {s.guardianName})</span>}
            {s.shelter && <span> - Abrigo: {s.shelter.name}</span>}
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
        <span>Página {page} de {totalPages}</span>
        <button 
          disabled={page === totalPages} 
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
3. Selecione o arquivo `Sheltered_API_Collection.postman_collection.json`
4. Configure as variáveis de ambiente

### Variáveis de Ambiente

Configure as seguintes variáveis no Postman:

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `base_url` | URL base da API | `http://localhost:3000` |
| `access_token` | Token JWT de autenticação | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `sheltered_id` | ID de exemplo para testes | `550e8400-e29b-41d4-a716-446655440000` |
| `shelter_id` | ID de shelter para testes | `660e8400-e29b-41d4-a716-446655440000` |

### Estrutura da Collection

A collection contém os seguintes requests:

1. **Listar Sheltered (Paginação)** - GET
2. **Listar Sheltered Simples** - GET
3. **Buscar Sheltered por ID** - GET
4. **Filtrar por Gênero** - GET
5. **Filtrar por Shelter** - GET
6. **Filtrar por Cidade** - GET
7. **Busca Geral** - GET
8. **Ordenar por Nome** - GET
9. **Ordenar por Data de Nascimento** - GET
10. **Criar Sheltered (Com Responsável)** - POST
11. **Criar Sheltered (Sem Responsável)** - POST
12. **Atualizar Sheltered** - PUT
13. **Deletar Sheltered** - DELETE

Cada request inclui:
- ✅ Exemplos de resposta (sucesso e erro)
- ✅ Descrição detalhada
- ✅ Códigos de status HTTP
- ✅ Parâmetros documentados

---

## Automações e Testes

### Scripts Disponíveis

#### 1. Automação de Criação

**Arquivo**: `automations/sheltered/sheltered-complete-automation.js`

**Funcionalidade**:
- Cria automaticamente 20 registros de sheltered
- 50% com responsável, 50% sem responsável
- Dados realistas (nomes, endereços, telefones)
- Vinculação aleatória com shelters existentes
- Salva resultado em JSON

**Executar**:
```bash
node automations/sheltered/sheltered-complete-automation.js
```

**Resultado**:
```
✅ 20 sheltered criados com sucesso
📁 Resultado salvo em: automations/sheltered/created-sheltered-[data].json
```

#### 2. Testes de Endpoints

**Arquivo**: `tests/sheltered/test-sheltered-crud.js`

**Testes Incluídos**:
- ✅ Listar sheltered (paginação)
- ✅ Listar sheltered simples
- ✅ Buscar por ID
- ✅ Criar sheltered (com e sem responsável)
- ✅ Atualizar sheltered
- ✅ Deletar sheltered
- ✅ Filtros (gênero, cidade, shelter)
- ✅ Ordenação
- ✅ Busca geral

**Executar**:
```bash
node tests/sheltered/test-sheltered-crud.js
```

**Resultado Esperado**:
```
✅ Taxa de sucesso: 91.7%
✅ 11 de 12 testes passaram
```

#### 3. Listar Shelters

**Arquivo**: `tests/sheltered/get-shelters-for-sheltered.js`

**Funcionalidade**:
- Lista todos os shelters disponíveis
- Fornece IDs para uso na automação
- Valida conectividade com a API

**Executar**:
```bash
node tests/sheltered/get-shelters-for-sheltered.js
```

---

## Troubleshooting

### Erro 400 - Bad Request

**Sintoma**: Requisição rejeitada com erro de validação

**Possíveis Causas**:
- Campos obrigatórios (`name`, `birthDate`, `gender`) não preenchidos
- Formato de data incorreto (deve ser YYYY-MM-DD)
- UUID inválido para `shelterId`
- Telefone fora do formato (5-32 caracteres)

**Solução**:
```json
{
  "name": "Nome Válido",
  "birthDate": "2010-05-15",
  "gender": "Masculino"
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

Renovar token se expirado:
```bash
POST /auth/login
{
  "email": "seu@email.com",
  "password": "sua-senha"
}
```

---

### Erro 404 - Not Found

**Sintoma**: Recurso não encontrado

**Possíveis Causas**:
- ID do sheltered não existe
- ID do shelter não existe
- Endpoint incorreto

**Solução**:
- Verificar se o ID é válido e existe no banco
- Confirmar que o endpoint está correto
- Listar todos os sheltered para verificar IDs disponíveis

---

### Erro 500 - Internal Server Error

**Sintoma**: Erro interno do servidor

**Possíveis Causas**:
- Erro no relacionamento (shelter_id ou address_id inválido)
- Problema de conexão com banco de dados
- Bug no código do servidor

**Solução**:
- Verificar logs do servidor
- Validar todos os relacionamentos
- Confirmar que o banco está acessível
- Reportar bug se necessário

---

### Problema: Campos Opcionais Retornando `null`

**Sintoma**: `guardianName` e `guardianPhone` retornam `null`

**Diagnóstico**: Este é o comportamento esperado! Campos opcionais podem ser `null`.

**Solução** (Frontend):
```typescript
// Tratamento seguro
const guardianDisplay = sheltered.guardianName ?? 'Não informado';
const phoneDisplay = sheltered.guardianPhone ?? 'Não informado';

// Renderização condicional
{sheltered.guardianName && (
  <span>Responsável: {sheltered.guardianName}</span>
)}
```

---

### Problema: Busca Não Encontra Sheltered

**Sintoma**: Filtros não retornam resultados esperados

**Possíveis Causas**:
- Busca é case-sensitive (não deveria, mas pode haver bug)
- Caracteres especiais na URL não codificados
- Filtro aplicado em campo vazio

**Solução**:
```typescript
// Codificar caracteres especiais
const params = new URLSearchParams({
  searchString: encodeURIComponent('João Silva'),
  city: encodeURIComponent('São Paulo'),
});

// Usar filtros corretamente
GET /sheltered?searchString=Silva
GET /sheltered?city=São+Paulo
```

---

### Problema: Paginação Incorreta

**Sintoma**: Número de páginas ou total de itens incorreto

**Diagnóstico**: Verificar se `limit` não excede 100

**Solução**:
```http
GET /sheltered?page=1&limit=20
```

Limites:
- Mínimo: 1 item por página
- Máximo: 100 itens por página
- Padrão: 20 itens por página

---

## Histórico de Mudanças

### v2.1.0 - Campos Opcionais (Outubro 2025)

**Mudanças**:
- ✅ `guardianName` agora é opcional
- ✅ `guardianPhone` agora é opcional
- ✅ Validações atualizadas para campos opcionais
- ✅ Repository atualizado com `COALESCE` para busca com null
- ✅ Automações atualizadas (50% com/sem responsável)
- ✅ Collection Postman atualizada com exemplos sem responsável
- ✅ Documentação atualizada com avisos e exemplos

**Impacto**:
- ✅ Permite registrar crianças sem responsável legal
- ✅ Mantém compatibilidade com dados existentes
- ⚠️ Frontend pode precisar tratamento para campos null

---

### v2.0.0 - Refatoração de Shelters (Setembro 2025)

**Mudanças**:
- ✅ Alinhamento com refatoração do módulo Shelters
- ✅ Campo `shelterNumber` removido → `shelterName` adicionado
- ✅ Relacionamento Many-to-One com Shelter simplificado
- ✅ Estrutura de resposta padronizada
- ✅ Filtros avançados implementados
- ✅ Paginação melhorada

**Impacto**:
- ⚠️ **Breaking Change**: Estrutura de dados alterada
- ✅ Melhoria na performance de queries
- ✅ Melhor experiência de busca

---

### v1.0.0 - Release Inicial (Setembro 2025)

**Funcionalidades**:
- ✅ CRUD completo de sheltered
- ✅ Paginação básica
- ✅ Filtros simples
- ✅ Relacionamento com Shelters
- ✅ Autenticação JWT
- ✅ Validações básicas

---

## Códigos de Status HTTP

| Código | Descrição | Quando Ocorre |
|--------|-----------|---------------|
| **200** | OK | Operação realizada com sucesso (GET, PUT, DELETE) |
| **201** | Created | Recurso criado com sucesso (POST) |
| **400** | Bad Request | Dados inválidos, validação falhou |
| **401** | Unauthorized | Token de autenticação inválido ou ausente |
| **403** | Forbidden | Acesso negado (sem permissão) |
| **404** | Not Found | Recurso não encontrado |
| **500** | Internal Server Error | Erro interno do servidor |

---

## Limitações e Considerações

### Paginação
- **Máximo**: 100 itens por página
- **Padrão**: 20 itens por página
- **Performance**: Queries otimizadas para grandes volumes

### Busca
- **Case-insensitive**: Busca não diferencia maiúsculas/minúsculas
- **Campos**: Nome, guardianName, guardianPhone
- **Performance**: Índices nos campos de busca

### Datas
- **Formato**: ISO 8601 (YYYY-MM-DD)
- **Validação**: Automática via class-validator
- **Timezone**: UTC

### UUIDs
- **Formato**: UUID v4
- **Validação**: Automática via class-validator
- **Geração**: Automática pelo banco de dados

### Telefones
- **Formato**: Internacional (+55...)
- **Tamanho**: 5-32 caracteres
- **Validação**: Comprimento apenas

### Campos Null
- **guardianName**: Pode ser null
- **guardianPhone**: Pode ser null
- **shelter**: Pode ser null
- **address**: Pode ser null
- **joinedAt**: Pode ser null

---

## Recursos Adicionais

### Arquivos Relacionados

#### Código Fonte
- `src/modules/sheltered/` - Módulo completo
- `src/modules/shelters/` - Módulo de Shelters (relacionado)
- `src/modules/addresses/` - Módulo de Endereços (relacionado)

#### Documentação
- `docs/collections/Sheltered_API_Collection.postman_collection.json` - Collection Postman
- `docs/sheltered/README.md` - README simplificado

#### Automações
- `automations/sheltered/sheltered-complete-automation.js` - Script de criação
- `tests/sheltered/test-sheltered-crud.js` - Script de testes

#### Resultados
- `automations/sheltered/created-sheltered-*.json` - Dados criados pela automação

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
**Versão da API**: 2.1.0  
**Autor**: Sistema de Orfanato

---


