# User API Collection - Documentação

## 📋 Visão Geral

Esta collection contém todos os endpoints do **User Controller** da API. Todos os endpoints requerem autenticação de **admin** (role admin).

## 📁 Arquivos Incluídos

- `User_API_Collection.postman_collection.json` - Collection principal com todos os endpoints
- `User_API_Environment.postman_environment.json` - Ambiente com variáveis pré-configuradas
- `User_API_Documentation.md` - Esta documentação
- `User_API_Usage_Examples.md` - Exemplos práticos de uso

## 🚀 Como Usar

### 1. Importar no Postman

1. Abra o Postman
2. Clique em "Import"
3. Selecione os arquivos:
   - `User_API_Collection.postman_collection.json`
   - `User_API_Environment.postman_environment.json`

### 2. Configurar o Ambiente

1. No Postman, selecione o ambiente "User API Environment"
2. Ajuste a variável `base_url` conforme necessário:
   - Desenvolvimento: `http://localhost:3000`
   - Produção: `https://sua-api.com`

### 3. Obter Token de Autenticação

1. Use a **Auth Collection** para fazer login como admin
2. O `access_token` será salvo automaticamente nas variáveis
3. Agora você pode usar todos os endpoints do User

### 4. Variáveis do Ambiente

O ambiente inclui as seguintes variáveis pré-configuradas:

#### 🔧 Configuração Base
- `{{base_url}}` - URL da API (padrão: `http://localhost:3000`)
- `{{access_token}}` - Token JWT (obtido via Auth Collection)

#### 👤 Dados de Usuário
- `{{user_id}}` - ID do usuário para testes
- `{{created_user_id}}` - ID do usuário criado automaticamente

#### 🔐 Credenciais Admin
- `{{admin_email}}` - Email do admin (padrão: `admin@example.com`)
- `{{admin_password}}` - Senha do admin (padrão: `password123`)

#### 🧪 Dados de Teste
- `{{test_user_name}}` - Nome para usuários de teste
- `{{test_user_email}}` - Email para usuários de teste
- `{{test_user_phone}}` - Telefone para usuários de teste
- `{{test_user_password}}` - Senha para usuários de teste

#### 🔍 Filtros e Paginação
- `{{search_term}}` - Termo de busca (padrão: `admin`)
- `{{user_role}}` - Role para filtros (padrão: `teacher`)
- `{{page_number}}` - Número da página (padrão: `1`)
- `{{page_size}}` - Tamanho da página (padrão: `10`)

### 5. Fluxo de Teste Recomendado

1. **Faça login** usando a Auth Collection para obter o `access_token`
2. **Crie um usuário** usando "Create User"
3. **Liste usuários** usando "Get All Users"
4. **Busque usuário** usando "Get User by ID"
5. **Atualize usuário** usando "Update User"
6. **Delete usuário** usando "Delete User"

## 📋 Endpoints Incluídos

### 👤 Gerenciamento de Usuários

#### 1. **Create User** - `POST /users`
- **Descrição**: Criar um novo usuário
- **Autenticação**: Admin (Bearer Token)
- **Body**:
  ```json
  {
    "name": "João Silva",
    "email": "joao.silva@example.com",
    "password": "password123",
    "phone": "+5511999999999",
    "role": "teacher",
    "completed": true,
    "commonUser": false,
    "active": true
  }
  ```
- **Resposta**: 201 Created com dados do usuário criado
- **Teste Automático**: Salva `created_user_id` nas variáveis

#### 2. **Get All Users** - `GET /users`
- **Descrição**: Listar todos os usuários com paginação
- **Autenticação**: Admin (Bearer Token)
- **Query Parameters**:
  - `page` (number): Número da página (padrão: 1)
  - `limit` (number): Itens por página (padrão: 12)
  - `q` (string): Termo de busca (nome, email)
  - `role` (string): Filtrar por role (admin, teacher, leader, user)
  - `active` (boolean): Filtrar por status ativo
  - `completed` (boolean): Filtrar por status completo
  - `sort` (string): Campo para ordenação (name, email, phone, role, createdAt, updatedAt)
  - `order` (string): Ordem (ASC/DESC)
- **Resposta**: 200 OK com dados paginados
- **Teste Automático**: Valida estrutura de paginação

#### 3. **Get User by ID** - `GET /users/:id`
- **Descrição**: Obter usuário específico por ID
- **Autenticação**: Admin (Bearer Token)
- **Parâmetros**: `id` (UUID) - ID do usuário
- **Resposta**: 200 OK com dados do usuário
- **Teste Automático**: Valida dados do usuário

#### 4. **Update User** - `PUT /users/:id`
- **Descrição**: Atualizar usuário específico
- **Autenticação**: Admin (Bearer Token)
- **Parâmetros**: `id` (UUID) - ID do usuário
- **Body** (todos os campos são opcionais):
  ```json
  {
    "name": "João Silva Atualizado",
    "email": "joao.silva.novo@example.com",
    "password": "newpassword123",
    "phone": "+5511888888888",
    "role": "leader",
    "active": true,
    "completed": true,
    "commonUser": false
  }
  ```
- **Resposta**: 200 OK com dados atualizados
- **Teste Automático**: Valida dados atualizados

#### 5. **Delete User** - `DELETE /users/:id`
- **Descrição**: Deletar usuário específico
- **Autenticação**: Admin (Bearer Token)
- **Parâmetros**: `id` (UUID) - ID do usuário
- **Resposta**: 200 OK com mensagem de sucesso
- **Teste Automático**: Valida mensagem de sucesso

#### 6. **Search Users** - `GET /users` (com filtros)
- **Descrição**: Buscar usuários com filtros específicos
- **Autenticação**: Admin (Bearer Token)
- **Query Parameters**: Todos os filtros disponíveis
- **Exemplo**: `?q=admin&role=admin&active=true&page=1&limit=5`
- **Resposta**: 200 OK com resultados filtrados
- **Teste Automático**: Valida resultados da busca

## 🧪 Testes Automatizados

Cada endpoint inclui testes que:
- ✅ Verificam status codes corretos (200/201)
- ✅ Validam estrutura das respostas JSON
- ✅ Salvam IDs automaticamente nas variáveis
- ✅ Mostram logs informativos no console

### 🔄 Fluxo Automático de Variáveis

1. **Create User**: Salva `created_user_id` automaticamente
2. **Get User by ID**: Usa `{{user_id}}` ou `{{created_user_id}}`
3. **Update User**: Usa `{{user_id}}` ou `{{created_user_id}}`
4. **Delete User**: Usa `{{user_id}}` ou `{{created_user_id}}`

## 📊 Estrutura de Dados

### User Entity
```typescript
{
  id: string;           // UUID
  name: string;         // Nome do usuário
  email: string;        // Email único
  phone: string;        // Telefone
  role: UserRole;       // admin | teacher | leader | user
  active: boolean;      // Status ativo
  completed: boolean;    // Status completo
  commonUser: boolean;  // Usuário comum
  createdAt: Date;      // Data de criação
  updatedAt: Date;      // Data de atualização
}
```

### UserRole Enum
```typescript
enum UserRole {
  ADMIN = 'admin',
  TEACHER = 'teacher', 
  LEADER = 'leader',
  USER = 'user'
}
```

### Resposta Paginada
```typescript
{
  data: UserEntity[];    // Array de usuários
  total: number;        // Total de registros
  page: number;         // Página atual
  limit: number;        // Limite por página
  pageCount: number;    // Total de páginas
}
```

## ⚠️ Notas Importantes

### 🔐 Autenticação
- **Todos os endpoints requerem autenticação de admin**
- Use `Authorization: Bearer {{access_token}}`
- O token deve ser obtido via Auth Collection

### 🎯 Roles Disponíveis
- `admin`: Acesso total ao sistema
- `teacher`: Professor/educador
- `leader`: Líder de shelter
- `user`: Usuário comum

### 🔍 Filtros de Busca
- `q`: Busca em nome e email
- `role`: Filtra por role específico
- `active`: Filtra por status ativo (true/false)
- `completed`: Filtra por status completo (true/false)

### 📝 Validações
- **Email**: Deve ser único e válido
- **Password**: Mínimo 6 caracteres
- **Phone**: Formato de telefone válido
- **Role**: Deve ser um dos valores válidos

## 🐛 Troubleshooting

### Erro 401 (Unauthorized)
- Verifique se o token está válido
- Confirme se o usuário tem role `admin`
- Execute refresh token se necessário

### Erro 403 (Forbidden)
- Confirme se o usuário tem role `admin`
- Verifique se o token não expirou

### Erro 404 (Not Found)
- Verifique se o `user_id` existe
- Confirme se o usuário não foi deletado

### Erro 400 (Bad Request)
- Verifique se todos os campos obrigatórios estão preenchidos
- Confirme se os tipos de dados estão corretos
- Valide se o email é único

## 🎨 Exemplos de Uso

### Criar Usuário Teacher
```json
{
  "name": "Maria Santos",
  "email": "maria.santos@example.com",
  "password": "password123",
  "phone": "+5511999999999",
  "role": "teacher",
  "completed": true,
  "commonUser": false,
  "active": true
}
```

### Buscar Usuários Ativos
```
GET /users?active=true&role=teacher&page=1&limit=10
```

### Atualizar Apenas Nome
```json
{
  "name": "Maria Santos Silva"
}
```

## 🔄 Fluxo de Trabalho Recomendado

1. **Login como Admin** → Obter `access_token`
2. **Criar Usuário** → Salvar `created_user_id`
3. **Listar Usuários** → Verificar criação
4. **Buscar Usuário** → Usar `created_user_id`
5. **Atualizar Usuário** → Modificar dados
6. **Deletar Usuário** → Limpar dados de teste

## 📈 Monitoramento

### Console do Postman
- Abra a aba "Console" (Ctrl+Alt+C)
- Veja logs de criação, atualização e deleção
- Monitore IDs salvos automaticamente

### Test Results
- Verifique se todos os testes passaram
- Analise falhas para identificar problemas
- Confirme estrutura das respostas
