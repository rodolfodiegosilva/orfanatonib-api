# 📚 Índice de Documentação - Teacher Profiles

> **Central de Referência Rápida do Módulo Teacher Profiles**

---

## 📖 Documentação Principal

### 🎯 [GUIA COMPLETO - Teacher Profiles](./TEACHER_PROFILES_COMPLETE_GUIDE.md)

**Este é o documento mais importante!** Contém TUDO sobre o módulo Teacher Profiles:

- ✅ Visão geral e conceitos básicos
- ✅ Estrutura de dados completa
- ✅ Todos os 6 endpoints da API
- ✅ Autenticação e autorização
- ✅ Filtros e ordenação avançados
- ✅ Vinculação com shelters
- ✅ DTOs e validações
- ✅ Relacionamentos com outras entidades
- ✅ Exemplos para backend (NestJS/TypeORM)
- ✅ Exemplos para frontend (React/TypeScript)
- ✅ Collection Postman
- ✅ Automações e testes
- ✅ Troubleshooting completo
- ✅ Histórico de mudanças

**👉 [Ir para o Guia Completo](./TEACHER_PROFILES_COMPLETE_GUIDE.md)**

---

## 🚀 Início Rápido

### Para Desenvolvedores Backend

```typescript
// 1. Importar o módulo
import { TeacherProfilesModule } from './modules/teacher-profiles/teacher-profiles.module';

// 2. Usar o repository
import { TeacherProfilesRepository } from './modules/teacher-profiles/repositories/teacher-profiles.repository';

// 3. Buscar teacher profiles
const teachers = await teacherProfilesRepository.findAllPaginated({
  page: 1,
  limit: 10,
  hasShelter: true,
});
```

**📘 Veja mais**: [Guia de Uso - Backend](./TEACHER_PROFILES_COMPLETE_GUIDE.md#guia-de-uso---backend)

---

### Para Desenvolvedores Frontend

```typescript
// 1. Fazer login e obter token
const { access_token } = await login();

// 2. Buscar teacher profiles
const response = await axios.get('/teacher-profiles?page=1&limit=10', {
  headers: { Authorization: `Bearer ${access_token}` }
});

// 3. Exibir dados
response.data.items.forEach(teacher => {
  console.log(teacher.user.name, teacher.shelter?.name);
});
```

**📘 Veja mais**: [Guia de Uso - Frontend](./TEACHER_PROFILES_COMPLETE_GUIDE.md#guia-de-uso---frontend)

---

## 📋 Endpoints Disponíveis

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| **GET** | `/teacher-profiles` | Lista com paginação e filtros |
| **GET** | `/teacher-profiles/simple` | Lista simplificada |
| **GET** | `/teacher-profiles/:id` | Busca por ID |
| **GET** | `/teacher-profiles/by-shelter/:shelterId` | Teachers de um shelter |
| **PATCH** | `/teacher-profiles/:id/assign-shelter` | Vincular a shelter |
| **PATCH** | `/teacher-profiles/:id/unassign-shelter` | Desvincular de shelter |

**📘 Detalhes**: [Endpoints da API](./TEACHER_PROFILES_COMPLETE_GUIDE.md#endpoints-da-api)

---

## 🔑 Campos Principais

### Estrutura Básica
- ✅ `id` - UUID único
- ✅ `active` - Status ativo/inativo
- ✅ `user` - Usuário vinculado (obrigatório)
- 🔓 `shelter` - Shelter vinculado (opcional)

**📘 Veja mais**: [Estrutura de Dados](./TEACHER_PROFILES_COMPLETE_GUIDE.md#estrutura-de-dados)

---

## 🔍 Exemplos de Filtros

```http
# Buscar teachers com shelter
GET /teacher-profiles?hasShelter=true&active=true

# Buscar teachers sem shelter
GET /teacher-profiles?hasShelter=false

# Buscar por nome/email/telefone
GET /teacher-profiles?q=João&sort=name&order=asc

# Buscar por shelter específico
GET /teacher-profiles?shelterId=uuid-shelter-id

# Buscar teachers inativos
GET /teacher-profiles?active=false

# Filtros combinados
GET /teacher-profiles?hasShelter=true&active=true&q=Silva&page=1&limit=10
```

**📘 Veja mais**: [Filtros e Ordenação](./TEACHER_PROFILES_COMPLETE_GUIDE.md#filtros-e-ordenação)

---

## 🔗 Vinculação com Shelters

### Vincular Teacher a Shelter

```http
PATCH /teacher-profiles/:teacherId/assign-shelter
Content-Type: application/json
Authorization: Bearer {{access_token}}

{
  "shelterId": "uuid-shelter-id"
}
```

### Desvincular Teacher de Shelter

```http
PATCH /teacher-profiles/:teacherId/unassign-shelter
Content-Type: application/json
Authorization: Bearer {{access_token}}

{
  "shelterId": "uuid-shelter-id"
}
```

⚠️ **Importante**: Apenas admins podem vincular/desvincular teachers

**📘 Veja mais**: [Vinculação com Shelters](./TEACHER_PROFILES_COMPLETE_GUIDE.md#vinculação-com-shelters)

---

## 🧪 Automações e Testes

### Teste Completo

```bash
# Testar todos os endpoints
node tests/teacher-profiles/test-teacher-profiles-complete-automation.js
```

### Teste de Vinculação

```bash
# Testar vinculação/desvinculação
node tests/teacher-profiles/test-teacher-shelter-linking.js
```

**📘 Veja mais**: [Automações e Testes](./TEACHER_PROFILES_COMPLETE_GUIDE.md#automações-e-testes)

---

## 📦 Collection Postman

### Importar

1. Abra o Postman
2. Clique em "Import"
3. Selecione: `docs/collections/Teacher_Profiles_API_Collection.postman_collection.json`
4. Configure as variáveis de ambiente

### Variáveis Necessárias

- `base_url` - URL da API (ex: `http://localhost:3000`)
- `access_token` - Token JWT de autenticação
- `teacher_profile_id` - ID para testes
- `shelter_id` - ID de shelter para testes

**📘 Veja mais**: [Collection Postman](./TEACHER_PROFILES_COMPLETE_GUIDE.md#collection-postman)

---

## 🔧 Troubleshooting

### Problemas Comuns

| Erro | Causa | Solução |
|------|-------|---------|
| **400** | UUID inválido ou teacher já vinculado | Verificar IDs e status |
| **401** | Token inválido | Fazer login novamente |
| **403** | Sem permissão | Usar conta admin |
| **404** | ID não existe | Verificar ID do teacher/shelter |

**📘 Veja mais**: [Troubleshooting Completo](./TEACHER_PROFILES_COMPLETE_GUIDE.md#troubleshooting)

---

## 📚 Relacionamentos

```
TeacherProfile
├── User (1:1) - Usuário vinculado (obrigatório)
└── Shelter (N:1) - Abrigo vinculado (opcional)
    └── Leader (1:1) - Coordenador do abrigo
```

**📘 Veja mais**: [Relacionamentos](./TEACHER_PROFILES_COMPLETE_GUIDE.md#relacionamentos)

---

## 📊 Estrutura de Arquivos

```
src/modules/teacher-profiles/
├── entities/
│   └── teacher-profile.entity.ts
├── dto/
│   ├── assign-shelter.dto.ts
│   ├── unassign-shelter.dto.ts
│   ├── query-teacher-profile.dto.ts
│   └── teacher-profile-response.dto.ts
├── repositories/
│   └── teacher-profiles.repository.ts
├── services/
│   └── teacher-profiles.service.ts
├── controller/
│   └── teacher-profiles.controller.ts
└── teacher-profiles.module.ts
```

---

## 🔄 Histórico de Versões

| Versão | Data | Mudanças |
|--------|------|----------|
| **1.2.0** | Set 2025 | Refatoração: `club` → `shelter` |
| **1.1.0** | Set 2025 | Release inicial com CRUD completo |

**📘 Veja mais**: [Histórico de Mudanças](./TEACHER_PROFILES_COMPLETE_GUIDE.md#histórico-de-mudanças)

---

## 🎓 Conceitos Importantes

### ⚠️ Criação Automática

Teacher profiles são criados **automaticamente** quando:
- Um usuário é criado com `role: 'teacher'`
- Um usuário existente tem seu role alterado para `teacher`

**Importante**: A criação é gerenciada pela orquestração do módulo Users.

**📘 Veja mais**: [Conceitos Básicos](./TEACHER_PROFILES_COMPLETE_GUIDE.md#conceitos-básicos)

---

### 🔐 Autorização

| Role | Permissões |
|------|------------|
| **admin** | Acesso total, pode vincular/desvincular |
| **coordinator** (leader) | Pode ver teachers dos seus shelters |
| **teacher** | Pode ver apenas próprios dados |

**📘 Veja mais**: [Autenticação e Autorização](./TEACHER_PROFILES_COMPLETE_GUIDE.md#autenticação-e-autorização)

---

## 📞 Links Rápidos

- 📖 [Guia Completo](./TEACHER_PROFILES_COMPLETE_GUIDE.md)
- 🔗 [Endpoints da API](./TEACHER_PROFILES_COMPLETE_GUIDE.md#endpoints-da-api)
- 🎨 [Exemplos Frontend](./TEACHER_PROFILES_COMPLETE_GUIDE.md#guia-de-uso---frontend)
- 🛠️ [Exemplos Backend](./TEACHER_PROFILES_COMPLETE_GUIDE.md#guia-de-uso---backend)
- 🔗 [Vinculação com Shelters](./TEACHER_PROFILES_COMPLETE_GUIDE.md#vinculação-com-shelters)
- 📦 [Collection Postman](./TEACHER_PROFILES_COMPLETE_GUIDE.md#collection-postman)
- 🔧 [Troubleshooting](./TEACHER_PROFILES_COMPLETE_GUIDE.md#troubleshooting)

---

## 💡 Dica

**Sempre consulte o [Guia Completo](./TEACHER_PROFILES_COMPLETE_GUIDE.md)** para informações detalhadas e atualizadas!

---

**Última Atualização**: Outubro 2025  
**Versão da API**: 1.2.0


