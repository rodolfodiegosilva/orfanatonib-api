# 📚 Collections - Postman Collections

## 📋 Visão Geral

Esta pasta contém todas as collections do Postman para os módulos da API do sistema de orfanato.

## 📁 Collections Disponíveis

### 🔐 Auth Module
- `Auth_API_Collection.postman_collection.json` - Collection completa do módulo Auth

### 👥 Users Module  
- `Users_API_Collection.postman_collection.json` - Collection completa do módulo Users (consolidada)

### 🏠 Shelters Module
- `Shelters_API_Collection.postman_collection.json` - Collection completa do módulo Shelters

### 👶 Sheltered Module
- `Sheltered_API_Collection.postman_collection.json` - Collection completa do módulo Sheltered

### 📚 Pagelas Module
- `Pagelas_API_Collection.postman_collection.json` - Collection completa do módulo Pagelas (atualizada com estrutura correta)

### 👨‍💼 Leader Profiles Module
- `Leader_Profiles_API_Collection.postman_collection.json` - Collection completa do módulo Leader Profiles

### 👨‍🏫 Teacher Profiles Module
- `Teacher_Profiles_API_Collection.postman_collection.json` - Collection completa do módulo Teacher Profiles

## 🚀 Como Usar

### Importar Collections
1. Abra o Postman
2. Clique em "Import"
3. Selecione os arquivos `.json` desta pasta
4. As collections serão importadas com todos os endpoints

### Configurar Ambiente
Use os arquivos da pasta `../environments/` para configurar as variáveis de ambiente.

## 📊 Características das Collections

### ✅ Funcionalidades Incluídas
- **Todos os endpoints** de cada módulo
- **Autenticação JWT** configurada
- **Variáveis de ambiente** prontas
- **Exemplos de resposta** detalhados
- **Tratamento de erros** completo
- **Headers automáticos** configurados

### 🎯 Endpoints por Módulo
- **Auth**: 8 endpoints (login, register, refresh, etc.)
- **Users**: 6 endpoints (CRUD, ativação, etc.)
- **Shelters**: 5 endpoints (CRUD, filtros, etc.)
- **Sheltered**: 6 endpoints (CRUD, vinculação, etc.)
- **Leader Profiles**: 7 endpoints (CRUD, vinculação, movimentação)
- **Teacher Profiles**: 7 endpoints (CRUD, vinculação, etc.)

## 🔧 Configuração

### Variáveis de Ambiente Necessárias
- `base_url` - URL base da API
- `access_token` - Token de autenticação
- `user_id` - ID do usuário logado
- `shelter_id` - ID do shelter (para testes)
- `leader_profile_id` - ID do leader profile (para testes)
- `teacher_profile_id` - ID do teacher profile (para testes)

### Credenciais de Teste
```json
{
  "email": "joao@example.com",
  "password": "password123"
}
```

---

**Collections - Sistema de Orfanato** 📚
