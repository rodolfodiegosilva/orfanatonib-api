# 📚 Índice de Documentação - Sheltered

> **Central de Referência Rápida do Módulo Sheltered**

---

## 📖 Documentação Principal

### 🎯 [GUIA COMPLETO - Sheltered](./SHELTERED_COMPLETE_GUIDE.md)

**Este é o documento mais importante!** Contém TUDO sobre o módulo Sheltered:

- ✅ Visão geral e conceitos básicos
- ✅ Estrutura de dados completa
- ✅ Todos os 6 endpoints da API
- ✅ Autenticação e autorização
- ✅ Filtros e ordenação avançados
- ✅ DTOs e validações
- ✅ Relacionamentos com outras entidades
- ✅ Exemplos para backend (NestJS/TypeORM)
- ✅ Exemplos para frontend (React/TypeScript)
- ✅ Collection Postman
- ✅ Automações e testes
- ✅ Troubleshooting completo
- ✅ Histórico de mudanças

**👉 [Ir para o Guia Completo](./SHELTERED_COMPLETE_GUIDE.md)**

---

## 🚀 Início Rápido

### Para Desenvolvedores Backend

```typescript
// 1. Importar o módulo
import { ShelteredModule } from './modules/sheltered/sheltered.module';

// 2. Usar o repository
import { ShelteredRepository } from './modules/sheltered/repositories/sheltered.repository';

// 3. Buscar sheltered
const sheltered = await shelteredRepository.findAllPaginated({
  page: 1,
  limit: 10,
  searchString: 'Silva',
});
```

**📘 Veja mais**: [Guia de Uso - Backend](./SHELTERED_COMPLETE_GUIDE.md#guia-de-uso---backend)

---

### Para Desenvolvedores Frontend

```typescript
// 1. Fazer login e obter token
const { access_token } = await login();

// 2. Buscar sheltered
const response = await axios.get('/sheltered?page=1&limit=10', {
  headers: { Authorization: `Bearer ${access_token}` }
});

// 3. Exibir dados
response.data.data.forEach(sheltered => {
  console.log(sheltered.name, sheltered.guardianName);
});
```

**📘 Veja mais**: [Guia de Uso - Frontend](./SHELTERED_COMPLETE_GUIDE.md#guia-de-uso---frontend)

---

## 📋 Endpoints Disponíveis

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| **GET** | `/sheltered` | Lista com paginação e filtros |
| **GET** | `/sheltered/simple` | Lista simplificada |
| **GET** | `/sheltered/:id` | Busca por ID |
| **POST** | `/sheltered` | Criar novo sheltered |
| **PUT** | `/sheltered/:id` | Atualizar sheltered |
| **DELETE** | `/sheltered/:id` | Deletar sheltered |

**📘 Detalhes**: [Endpoints da API](./SHELTERED_COMPLETE_GUIDE.md#endpoints-da-api)

---

## 🔑 Campos Principais

### Obrigatórios
- ✅ `name` - Nome completo
- ✅ `birthDate` - Data de nascimento (YYYY-MM-DD)
- ✅ `gender` - Gênero

### Opcionais
- 🔓 `guardianName` - Nome do responsável
- 🔓 `guardianPhone` - Telefone do responsável
- 🔓 `joinedAt` - Data de ingresso
- 🔓 `shelterId` - ID do shelter
- 🔓 `address` - Endereço completo

**📘 Veja mais**: [Estrutura de Dados](./SHELTERED_COMPLETE_GUIDE.md#estrutura-de-dados)

---

## 🔍 Exemplos de Filtros

```http
# Buscar por gênero
GET /sheltered?gender=Feminino

# Buscar por cidade
GET /sheltered?city=São Paulo

# Buscar por shelter
GET /sheltered?shelterName=Central

# Buscar por data de nascimento
GET /sheltered?birthDateFrom=2010-01-01&birthDateTo=2015-12-31

# Busca geral
GET /sheltered?searchString=Silva

# Ordenar por nome
GET /sheltered?orderBy=name&order=ASC
```

**📘 Veja mais**: [Filtros e Ordenação](./SHELTERED_COMPLETE_GUIDE.md#filtros-e-ordenação)

---

## 🧪 Automações e Testes

### Criar Dados de Teste

```bash
# Criar 20 sheltered automaticamente
node automations/sheltered/sheltered-complete-automation.js
```

### Testar Endpoints

```bash
# Testar todos os endpoints
node tests/sheltered/test-sheltered-crud.js
```

**📘 Veja mais**: [Automações e Testes](./SHELTERED_COMPLETE_GUIDE.md#automações-e-testes)

---

## 📦 Collection Postman

### Importar

1. Abra o Postman
2. Clique em "Import"
3. Selecione: `docs/collections/Sheltered_API_Collection.postman_collection.json`
4. Configure as variáveis de ambiente

### Variáveis Necessárias

- `base_url` - URL da API (ex: `http://localhost:3000`)
- `access_token` - Token JWT de autenticação
- `sheltered_id` - ID para testes
- `shelter_id` - ID de shelter para testes

**📘 Veja mais**: [Collection Postman](./SHELTERED_COMPLETE_GUIDE.md#collection-postman)

---

## 🔧 Troubleshooting

### Problemas Comuns

| Erro | Causa | Solução |
|------|-------|---------|
| **400** | Dados inválidos | Verificar campos obrigatórios |
| **401** | Token inválido | Fazer login novamente |
| **404** | ID não existe | Verificar ID do sheltered |
| **500** | Erro interno | Verificar logs do servidor |

**📘 Veja mais**: [Troubleshooting Completo](./SHELTERED_COMPLETE_GUIDE.md#troubleshooting)

---

## 📚 Relacionamentos

```
Sheltered
├── Shelter (N:1) - Abrigo onde está
├── Address (1:1) - Endereço da criança
├── AcceptedChrists (1:N) - Aceitações de Cristo
└── Pagelas (1:N) - Páginas relacionadas
```

**📘 Veja mais**: [Relacionamentos](./SHELTERED_COMPLETE_GUIDE.md#relacionamentos)

---

## 📊 Estrutura de Arquivos

```
src/modules/sheltered/
├── entities/
│   └── sheltered.entity.ts
├── dto/
│   ├── create-sheltered.dto.ts
│   ├── update-sheltered.dto.ts
│   ├── query-sheltered.dto.ts
│   └── sheltered-response.dto.ts
├── repositories/
│   └── sheltered.repository.ts
├── services/
│   ├── create-sheltered.service.ts
│   ├── get-sheltered.service.ts
│   ├── update-sheltered.service.ts
│   └── delete-sheltered.service.ts
├── sheltered.controller.ts
└── sheltered.module.ts
```

---

## 🔄 Histórico de Versões

| Versão | Data | Mudanças |
|--------|------|----------|
| **2.1.0** | Out 2025 | Campos opcionais (`guardianName`, `guardianPhone`) |
| **2.0.0** | Set 2025 | Refatoração de Shelters, filtros avançados |
| **1.0.0** | Set 2025 | Release inicial com CRUD completo |

**📘 Veja mais**: [Histórico de Mudanças](./SHELTERED_COMPLETE_GUIDE.md#histórico-de-mudanças)

---

## 🎓 Conceitos Importantes

### ⚠️ Campos Opcionais

Os campos `guardianName` e `guardianPhone` são **opcionais** desde a versão 2.1.0. Isso permite registrar crianças sem responsável legal.

**Importante no Frontend**:
```typescript
// Sempre verificar se o campo existe
const guardianDisplay = sheltered.guardianName ?? 'Não informado';

// Ou renderização condicional
{sheltered.guardianName && (
  <span>Responsável: {sheltered.guardianName}</span>
)}
```

**📘 Veja mais**: [Campos Opcionais](./SHELTERED_COMPLETE_GUIDE.md#campos-obrigatórios-vs-opcionais)

---

## 🔐 Autenticação

Todos os endpoints requerem autenticação:

```http
Authorization: Bearer {{access_token}}
```

### Obter Token

```bash
POST /auth/login
Content-Type: application/json

{
  "email": "seu@email.com",
  "password": "sua-senha"
}
```

**📘 Veja mais**: [Autenticação e Autorização](./SHELTERED_COMPLETE_GUIDE.md#autenticação-e-autorização)

---

## 📞 Links Rápidos

- 📖 [Guia Completo](./SHELTERED_COMPLETE_GUIDE.md)
- 🔗 [Endpoints da API](./SHELTERED_COMPLETE_GUIDE.md#endpoints-da-api)
- 🎨 [Exemplos Frontend](./SHELTERED_COMPLETE_GUIDE.md#guia-de-uso---frontend)
- 🛠️ [Exemplos Backend](./SHELTERED_COMPLETE_GUIDE.md#guia-de-uso---backend)
- 📦 [Collection Postman](./SHELTERED_COMPLETE_GUIDE.md#collection-postman)
- 🔧 [Troubleshooting](./SHELTERED_COMPLETE_GUIDE.md#troubleshooting)

---

## 💡 Dica

**Sempre consulte o [Guia Completo](./SHELTERED_COMPLETE_GUIDE.md)** para informações detalhadas e atualizadas!

---

**Última Atualização**: Outubro 2025  
**Versão da API**: 2.1.0


