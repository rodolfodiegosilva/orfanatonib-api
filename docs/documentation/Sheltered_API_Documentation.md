# Sheltered API Documentation

## Visão Geral

A API do módulo Sheltered permite gerenciar registros de pessoas acolhidas nos abrigos. Este módulo oferece funcionalidades completas de CRUD (Create, Read, Update, Delete) com paginação, filtros avançados e busca.

**⚠️ IMPORTANTE:** Os campos `guardianName` e `guardianPhone` são **opcionais**, permitindo registrar sheltered sem responsável.

## Autenticação

Todos os endpoints requerem autenticação via Bearer Token:

```
Authorization: Bearer {{access_token}}
```

## Endpoints

### 1. Listar Sheltered (Paginação)

**GET** `/sheltered`

Lista todos os sheltered com paginação e filtros opcionais.

#### Parâmetros de Query

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `page` | number | Não | Número da página (padrão: 1) |
| `limit` | number | Não | Itens por página (padrão: 20) |
| `orderBy` | string | Não | Campo para ordenação (`name`, `birthDate`, `joinedAt`, `createdAt`) |
| `order` | string | Não | Ordem da ordenação (`ASC`, `DESC`) |
| `searchString` | string | Não | Busca geral por nome ou responsável |
| `shelterId` | string | Não | Filtrar por ID do shelter |
| `shelterName` | string | Não | Filtrar por nome do shelter |
| `city` | string | Não | Filtrar por cidade |
| `state` | string | Não | Filtrar por estado |
| `gender` | string | Não | Filtrar por gênero |
| `birthDate` | string | Não | Filtrar por data de nascimento específica (YYYY-MM-DD) |
| `birthDateFrom` | string | Não | Filtrar por data de nascimento a partir de (YYYY-MM-DD) |
| `birthDateTo` | string | Não | Filtrar por data de nascimento até (YYYY-MM-DD) |
| `joinedAt` | string | Não | Filtrar por data de ingresso específica (YYYY-MM-DD) |
| `joinedFrom` | string | Não | Filtrar por data de ingresso a partir de (YYYY-MM-DD) |
| `joinedTo` | string | Não | Filtrar por data de ingresso até (YYYY-MM-DD) |

#### Exemplo de Requisição

```http
GET /sheltered?page=1&limit=5&orderBy=name&order=ASC&gender=Feminino
Authorization: Bearer {{access_token}}
```

#### Exemplo de Resposta

```json
{
  "data": [
    {
      "id": "uuid-sheltered-1",
      "name": "Ana Silva",
      "birthDate": "2010-05-15",
      "guardianName": "Maria Silva",
      "gender": "Feminino",
      "guardianPhone": "+5511999999999",
      "joinedAt": "2024-01-15",
      "shelter": {
        "id": "uuid-shelter-1",
        "name": "Abrigo Central"
      },
      "address": {
        "id": "uuid-address-1",
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
      "id": "uuid-sheltered-2",
      "name": "João Sem Responsável",
      "birthDate": "2012-03-20",
      "guardianName": null,
      "gender": "Masculino",
      "guardianPhone": null,
      "joinedAt": "2024-02-01",
      "shelter": {
        "id": "uuid-shelter-2",
        "name": "Abrigo Jardins"
      },
      "address": {
        "id": "uuid-address-2",
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

### 2. Listar Sheltered Simples

**GET** `/sheltered/simple`

Lista todos os sheltered em formato simplificado.

#### Exemplo de Requisição

```http
GET /sheltered/simple
Authorization: Bearer {{access_token}}
```

#### Exemplo de Resposta

```json
[
  {
    "id": "uuid-sheltered-1",
    "name": "Ana Silva",
    "guardianName": "Maria Silva",
    "gender": "Feminino",
    "guardianPhone": "+5511999999999",
    "shelterId": "uuid-shelter-1",
    "acceptedChrists": []
  },
  {
    "id": "uuid-sheltered-2",
    "name": "Bruno Santos",
    "guardianName": "João Santos",
    "gender": "Masculino",
    "guardianPhone": "+5511888888888",
    "shelterId": "uuid-shelter-2",
    "acceptedChrists": []
  }
]
```

### 3. Buscar Sheltered por ID

**GET** `/sheltered/:id`

Busca um sheltered específico por ID.

#### Parâmetros de Path

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `id` | string | Sim | UUID do sheltered |

#### Exemplo de Requisição

```http
GET /sheltered/uuid-sheltered-1
Authorization: Bearer {{access_token}}
```

#### Exemplo de Resposta

```json
{
  "id": "uuid-sheltered-1",
  "name": "Ana Silva",
  "birthDate": "2010-05-15",
  "guardianName": "Maria Silva",
  "gender": "Feminino",
  "guardianPhone": "+5511999999999",
  "joinedAt": "2024-01-15",
  "shelter": {
    "id": "uuid-shelter-1",
    "name": "Abrigo Central"
  },
  "address": {
    "id": "uuid-address-1",
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

### 4. Criar Sheltered

**POST** `/sheltered`

Cria um novo sheltered.

#### Campos Obrigatórios

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `name` | string | Nome do sheltered (2-255 caracteres) |
| `birthDate` | string | Data de nascimento (formato YYYY-MM-DD) |
| `gender` | string | Gênero (2-255 caracteres) |

#### Campos Opcionais

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `guardianName` | string | Nome do responsável (2-255 caracteres) |
| `guardianPhone` | string | Telefone do responsável (5-32 caracteres) |
| `joinedAt` | string | Data de ingresso (formato YYYY-MM-DD) |
| `shelterId` | string | UUID do shelter |
| `address` | object | Endereço completo |

#### Exemplo de Requisição (com responsável)

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
  "shelterId": "uuid-shelter-1",
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

#### Exemplo de Requisição (sem responsável)

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
  "id": "uuid-sheltered-novo",
  "name": "João Silva",
  "birthDate": "2010-05-15",
  "guardianName": "Maria Silva",
  "gender": "Masculino",
  "guardianPhone": "+5511999999999",
  "joinedAt": "2024-01-15",
  "shelter": {
    "id": "uuid-shelter-1",
    "name": "Abrigo Central"
  },
  "address": {
    "id": "uuid-address-novo",
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

### 5. Atualizar Sheltered

**PUT** `/sheltered/:id`

Atualiza um sheltered existente.

#### Parâmetros de Path

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `id` | string | Sim | UUID do sheltered |

#### Campos Opcionais

Todos os campos são opcionais na atualização.

#### Exemplo de Requisição

```http
PUT /sheltered/uuid-sheltered-1
Authorization: Bearer {{access_token}}
Content-Type: application/json

{
  "name": "João Silva Santos",
  "guardianName": "Maria Silva Santos",
  "gender": "Masculino"
}
```

#### Exemplo de Resposta (200 OK)

```json
{
  "id": "uuid-sheltered-1",
  "name": "João Silva Santos",
  "birthDate": "2010-05-15",
  "guardianName": "Maria Silva Santos",
  "gender": "Masculino",
  "guardianPhone": "+5511999999999",
  "joinedAt": "2024-01-15",
  "shelter": {
    "id": "uuid-shelter-1",
    "name": "Abrigo Central"
  },
  "address": {
    "id": "uuid-address-1",
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

### 6. Deletar Sheltered

**DELETE** `/sheltered/:id`

Remove um sheltered.

#### Parâmetros de Path

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `id` | string | Sim | UUID do sheltered |

#### Exemplo de Requisição

```http
DELETE /sheltered/uuid-sheltered-1
Authorization: Bearer {{access_token}}
```

#### Exemplo de Resposta (200 OK)

```json
{}
```

## Códigos de Status HTTP

| Código | Descrição |
|--------|-----------|
| 200 | OK - Operação realizada com sucesso |
| 201 | Created - Recurso criado com sucesso |
| 400 | Bad Request - Dados inválidos |
| 401 | Unauthorized - Token de autenticação inválido |
| 403 | Forbidden - Acesso negado |
| 404 | Not Found - Recurso não encontrado |
| 500 | Internal Server Error - Erro interno do servidor |

## Exemplos de Uso

### Buscar sheltered por gênero

```http
GET /sheltered?gender=Feminino&page=1&limit=10
```

### Buscar sheltered por shelter

```http
GET /sheltered?shelterName=Central&page=1&limit=5
```

### Buscar sheltered por cidade

```http
GET /sheltered?city=São Paulo&page=1&limit=10
```

### Buscar sheltered por data de nascimento

```http
GET /sheltered?birthDateFrom=2010-01-01&birthDateTo=2015-12-31&page=1&limit=10
```

### Ordenar por data de nascimento

```http
GET /sheltered?orderBy=birthDate&order=DESC&page=1&limit=10
```

## Automação e Testes

### Scripts Disponíveis

1. **`create-sheltered-automation.js`** - Cria automaticamente 20 registros de sheltered
2. **`test-sheltered-endpoints.js`** - Testa todos os endpoints do módulo
3. **`get-shelters-for-sheltered.js`** - Lista shelters disponíveis para referência

### Executar Automação

```bash
# Criar registros de sheltered
node create-sheltered-automation.js

# Testar endpoints
node test-sheltered-endpoints.js

# Listar shelters disponíveis
node get-shelters-for-sheltered.js
```

### Resultados dos Testes

- ✅ **Taxa de sucesso:** 91.7%
- ✅ **Endpoints testados:** 12
- ✅ **Sucessos:** 11
- ❌ **Falhas:** 1 (caracteres especiais na URL)

## Collection Postman

A collection `Sheltered_API_Collection.postman_collection.json` está disponível com:

- ✅ Todos os endpoints configurados
- ✅ Exemplos de requisição e resposta
- ✅ Códigos de status HTTP
- ✅ Parâmetros de query documentados
- ✅ Autenticação Bearer Token configurada
- ✅ Variáveis de ambiente suportadas

### Importar Collection

1. Abra o Postman
2. Clique em "Import"
3. Selecione o arquivo `Sheltered_API_Collection.postman_collection.json`
4. Configure as variáveis de ambiente:
   - `base_url`: URL base da API
   - `access_token`: Token de autenticação
   - `sheltered_id`: ID de exemplo para testes
   - `shelter_id`: ID de shelter para testes

## DTOs (Data Transfer Objects)

### CreateShelteredDto

```typescript
export class CreateShelteredDto {
  @IsString() @Length(2, 255) name: string;
  @IsDateString() birthDate: string;
  @IsOptional() @IsString() @Length(2, 255) guardianName?: string;
  @IsString() @Length(2, 255) gender: string;
  @IsOptional() @IsString() @Length(5, 32) guardianPhone?: string;
  @IsOptional() @IsDateString() joinedAt?: string;
  @IsOptional() @IsUUID() shelterId?: string;
  @IsOptional() @ValidateNested() @Type(() => AddressDto) address?: AddressDto;
}
```

### QueryShelteredDto

```typescript
export class QueryShelteredDto {
  @IsOptional() @IsString() searchString?: string;
  @IsOptional() @IsUUID() shelterId?: string;
  @IsOptional() @IsString() shelterName?: string;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsString() state?: string;
  @IsOptional() @IsString() gender?: string;
  @IsOptional() @IsString() birthDate?: string;
  @IsOptional() @IsString() birthDateFrom?: string;
  @IsOptional() @IsString() birthDateTo?: string;
  @IsOptional() @IsString() joinedAt?: string;
  @IsOptional() @IsString() joinedFrom?: string;
  @IsOptional() @IsString() joinedTo?: string;
  @IsOptional() @IsString() orderBy?: 'name' | 'birthDate' | 'joinedAt' | 'createdAt';
  @IsOptional() @IsIn(['ASC', 'DESC']) order?: 'ASC' | 'DESC' = 'ASC';
  @Transform(({ value }) => Number(value)) @IsOptional() @IsInt() @Min(1) page?: number = 1;
  @Transform(({ value }) => Number(value)) @IsOptional() @IsInt() @Min(1) limit?: number = 20;
}
```

### ShelteredResponseDto

```typescript
export class ShelteredResponseDto {
  id: string;
  name: string;
  birthDate: string;
  guardianName?: string | null;
  gender: string;
  guardianPhone?: string | null;
  joinedAt?: string | null;
  shelter?: { id: string; name: string } | null;
  address?: AddressResponseDto | null;
  createdAt: string;
  updatedAt: string;
}
```

## Relacionamentos

### Shelter
- **Tipo:** Many-to-One
- **Descrição:** Cada sheltered pode estar vinculado a um shelter
- **Campo:** `shelterId` (opcional)

### Address
- **Tipo:** One-to-One
- **Descrição:** Cada sheltered pode ter um endereço
- **Campo:** `address` (opcional)

### AcceptedChrists
- **Tipo:** One-to-Many
- **Descrição:** Cada sheltered pode ter múltiplos registros de aceitação de Cristo
- **Campo:** `acceptedChrists` (array)

### Pagelas
- **Tipo:** One-to-Many
- **Descrição:** Cada sheltered pode ter múltiplas páginas
- **Campo:** `pagelas` (array)

## Validações

### Campos Obrigatórios
- `name`: 2-255 caracteres
- `birthDate`: Formato YYYY-MM-DD
- `gender`: 2-255 caracteres

### Campos Opcionais
- `guardianName`: 2-255 caracteres (pode ser null)
- `guardianPhone`: 5-32 caracteres (pode ser null)
- `joinedAt`: Formato YYYY-MM-DD
- `shelterId`: UUID válido
- `address`: Objeto com campos de endereço

### Validações de Endereço
- `street`: String obrigatória
- `number`: String opcional
- `district`: String obrigatória
- `city`: String obrigatória
- `state`: String obrigatória
- `postalCode`: String obrigatória
- `complement`: String opcional

## Limitações e Considerações

1. **Paginação:** Máximo de 100 itens por página
2. **Busca:** Case-insensitive para strings
3. **Datas:** Formato ISO 8601 (YYYY-MM-DD)
4. **UUIDs:** Devem ser válidos para relacionamentos
5. **Telefones:** Aceita formatos internacionais (+55...)

## Troubleshooting

### Erro 400 - Bad Request
- Verifique se todos os campos obrigatórios estão preenchidos
- Confirme se as datas estão no formato correto (YYYY-MM-DD)
- Valide se os UUIDs são válidos

### Erro 401 - Unauthorized
- Verifique se o token de autenticação está válido
- Confirme se o header `Authorization` está presente

### Erro 404 - Not Found
- Verifique se o ID do sheltered existe
- Confirme se o ID do shelter é válido (se fornecido)

### Erro 500 - Internal Server Error
- Verifique os logs do servidor
- Confirme se todos os relacionamentos estão corretos