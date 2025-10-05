# User API - Exemplos Práticos de Uso

## 🎯 Cenários de Teste Comuns

### 1. Criar Usuário Teacher Completo

```http
POST {{base_url}}/users
Authorization: Bearer {{access_token}}
Content-Type: application/json

{
  "name": "Ana Professora",
  "email": "ana.professora@example.com",
  "password": "senha123",
  "phone": "+5511999888777",
  "role": "teacher",
  "completed": true,
  "commonUser": false,
  "active": true
}
```

**Resultado**: Usuário teacher criado com perfil completo.

### 2. Criar Usuário Leader

```http
POST {{base_url}}/users
Authorization: Bearer {{access_token}}
Content-Type: application/json

{
  "name": "Carlos Líder",
  "email": "carlos.lider@example.com",
  "password": "senha123",
  "phone": "+5511888777666",
  "role": "leader",
  "completed": true,
  "commonUser": false,
  "active": true
}
```

**Resultado**: Usuário leader criado para gerenciar shelters.

### 3. Criar Usuário Comum

```http
POST {{base_url}}/users
Authorization: Bearer {{access_token}}
Content-Type: application/json

{
  "name": "João Usuário",
  "email": "joao.usuario@example.com",
  "password": "senha123",
  "phone": "+5511777666555",
  "role": "user",
  "completed": false,
  "commonUser": true,
  "active": true
}
```

**Resultado**: Usuário comum criado com perfil básico.

## 🔍 Buscas e Filtros

### 1. Buscar por Nome

```http
GET {{base_url}}/users?q=Ana&page=1&limit=10
Authorization: Bearer {{access_token}}
```

**Resultado**: Lista usuários com "Ana" no nome ou email.

### 2. Filtrar por Role

```http
GET {{base_url}}/users?role=teacher&active=true&page=1&limit=20
Authorization: Bearer {{access_token}}
```

**Resultado**: Lista apenas teachers ativos.

### 3. Buscar Usuários Incompletos

```http
GET {{base_url}}/users?completed=false&page=1&limit=15
Authorization: Bearer {{access_token}}
```

**Resultado**: Lista usuários com perfil incompleto.

### 4. Ordenar por Data de Criação

```http
GET {{base_url}}/users?sort=createdAt&order=DESC&page=1&limit=10
Authorization: Bearer {{access_token}}
```

**Resultado**: Usuários mais recentes primeiro.

## ✏️ Atualizações Específicas

### 1. Ativar/Desativar Usuário

```http
PUT {{base_url}}/users/{{user_id}}
Authorization: Bearer {{access_token}}
Content-Type: application/json

{
  "active": false
}
```

**Resultado**: Usuário desativado (soft delete).

### 2. Promover Usuário para Leader

```http
PUT {{base_url}}/users/{{user_id}}
Authorization: Bearer {{access_token}}
Content-Type: application/json

{
  "role": "leader",
  "completed": true
}
```

**Resultado**: Usuário promovido e perfil marcado como completo.

### 3. Atualizar Dados de Contato

```http
PUT {{base_url}}/users/{{user_id}}
Authorization: Bearer {{access_token}}
Content-Type: application/json

{
  "phone": "+5511999888777",
  "email": "novo.email@example.com"
}
```

**Resultado**: Dados de contato atualizados.

### 4. Alterar Senha

```http
PUT {{base_url}}/users/{{user_id}}
Authorization: Bearer {{access_token}}
Content-Type: application/json

{
  "password": "novaSenha123"
}
```

**Resultado**: Senha alterada (hash será gerado automaticamente).

## 🗑️ Operações de Deleção

### 1. Deletar Usuário Específico

```http
DELETE {{base_url}}/users/{{user_id}}
Authorization: Bearer {{access_token}}
```

**Resultado**: Usuário removido permanentemente.

### 2. Deletar Usuário Criado em Teste

```http
DELETE {{base_url}}/users/{{created_user_id}}
Authorization: Bearer {{access_token}}
```

**Resultado**: Usuário de teste removido (usando ID salvo automaticamente).

## 📊 Consultas Avançadas

### 1. Relatório de Usuários por Role

```http
GET {{base_url}}/users?role=admin&page=1&limit=100
Authorization: Bearer {{access_token}}
```

```http
GET {{base_url}}/users?role=teacher&page=1&limit=100
Authorization: Bearer {{access_token}}
```

```http
GET {{base_url}}/users?role=leader&page=1&limit=100
Authorization: Bearer {{access_token}}
```

```http
GET {{base_url}}/users?role=user&page=1&limit=100
Authorization: Bearer {{access_token}}
```

**Resultado**: Contagem de usuários por role.

### 2. Usuários Ativos vs Inativos

```http
GET {{base_url}}/users?active=true&page=1&limit=100
Authorization: Bearer {{access_token}}
```

```http
GET {{base_url}}/users?active=false&page=1&limit=100
Authorization: Bearer {{access_token}}
```

**Resultado**: Análise de usuários ativos vs inativos.

### 3. Usuários com Perfil Completo

```http
GET {{base_url}}/users?completed=true&active=true&page=1&limit=100
Authorization: Bearer {{access_token}}
```

**Resultado**: Usuários prontos para uso completo do sistema.

## 🔄 Fluxo de Trabalho Completo

### Cenário: Gerenciar Professor

1. **Criar Professor**:
   ```http
   POST {{base_url}}/users
   Authorization: Bearer {{access_token}}
   Content-Type: application/json
   
   {
     "name": "Prof. Maria Silva",
     "email": "maria.silva@escola.com",
     "password": "prof123",
     "phone": "+5511999888777",
     "role": "teacher",
     "completed": true,
     "commonUser": false,
     "active": true
   }
   ```

2. **Verificar Criação**:
   ```http
   GET {{base_url}}/users?q=Maria&role=teacher
   Authorization: Bearer {{access_token}}
   ```

3. **Obter Detalhes**:
   ```http
   GET {{base_url}}/users/{{created_user_id}}
   Authorization: Bearer {{access_token}}
   ```

4. **Atualizar Telefone**:
   ```http
   PUT {{base_url}}/users/{{created_user_id}}
   Authorization: Bearer {{access_token}}
   Content-Type: application/json
   
   {
     "phone": "+5511888777666"
   }
   ```

5. **Desativar Professor**:
   ```http
   PUT {{base_url}}/users/{{created_user_id}}
   Authorization: Bearer {{access_token}}
   Content-Type: application/json
   
   {
     "active": false
   }
   ```

6. **Remover Professor**:
   ```http
   DELETE {{base_url}}/users/{{created_user_id}}
   Authorization: Bearer {{access_token}}
   ```

## 🎨 Dicas de Uso

### Usar Variáveis Dinâmicas

```http
GET {{base_url}}/users/{{created_user_id}}
Authorization: Bearer {{access_token}}
```

### Usar Variáveis de Ambiente

```http
GET {{base_url}}/users?role={{user_role}}&active=true
Authorization: Bearer {{access_token}}
```

### Usar Query Parameters Dinâmicos

```http
GET {{base_url}}/users?q={{search_term}}&page={{page_number}}&limit={{page_size}}
Authorization: Bearer {{access_token}}
```

## 🐛 Troubleshooting Comum

### Erro: Email já existe
```json
{
  "statusCode": 400,
  "message": "Email já está em uso",
  "error": "Bad Request"
}
```
**Solução**: Use um email único ou atualize o usuário existente.

### Erro: Role inválido
```json
{
  "statusCode": 400,
  "message": "Role deve ser um dos valores: admin, teacher, leader, user",
  "error": "Bad Request"
}
```
**Solução**: Use apenas roles válidos: `admin`, `teacher`, `leader`, `user`.

### Erro: Senha muito curta
```json
{
  "statusCode": 400,
  "message": "Senha deve ter pelo menos 6 caracteres",
  "error": "Bad Request"
}
```
**Solução**: Use senhas com pelo menos 6 caracteres.

### Erro: Usuário não encontrado
```json
{
  "statusCode": 404,
  "message": "Usuário não encontrado",
  "error": "Not Found"
}
```
**Solução**: Verifique se o `user_id` existe e está correto.

## 📈 Monitoramento e Logs

### Console do Postman
- **Criação**: "Usuário criado com sucesso! ID: xxx"
- **Busca**: "Usuários encontrados: X"
- **Atualização**: "Usuário atualizado com sucesso!"
- **Deleção**: "Usuário deletado com sucesso!"

### Test Results
- ✅ Status codes corretos
- ✅ Estrutura de dados válida
- ✅ IDs salvos automaticamente
- ✅ Validações de campos

