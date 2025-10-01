# 🌍 Environments - Ambientes Postman

## 📋 Visão Geral

Esta pasta contém todos os ambientes do Postman para os módulos da API do sistema de orfanato.

## 📁 Ambientes Disponíveis

### 🔐 Auth Module
- `Auth_API_Environment.postman_environment.json` - Ambiente específico do módulo Auth

### 👥 Users Module
- `User_API_Environment.postman_environment.json` - Ambiente específico do módulo Users

### 👨‍💼 Leader Profiles Module
- `Leader_Profiles_API_Environment.postman_environment.json` - Ambiente específico do módulo Leader Profiles

### 🌐 Ambiente Geral
- `Orfanatonib_API_Environment.postman_environment.json` - Ambiente geral para todos os módulos

## 🚀 Como Usar

### Importar Ambientes
1. Abra o Postman
2. Clique em "Import"
3. Selecione os arquivos `.json` desta pasta
4. Os ambientes serão importados com todas as variáveis

### Configurar Ambiente
1. Selecione o ambiente desejado no dropdown
2. Configure as variáveis conforme necessário
3. Use nas collections importadas

## 📊 Variáveis Disponíveis

### 🔧 Variáveis Gerais
- `base_url` - URL base da API (http://localhost:3000)
- `access_token` - Token de autenticação JWT
- `refresh_token` - Token de renovação
- `user_id` - ID do usuário logado

### 🏠 Variáveis de Shelters
- `shelter_id` - ID do shelter para testes
- `shelter_name` - Nome do shelter
- `shelter_time` - Horário do shelter

### 👨‍💼 Variáveis de Leader Profiles
- `leader_profile_id` - ID do leader profile
- `leader_user_id` - ID do usuário líder
- `leader_name` - Nome do líder

### 👨‍🏫 Variáveis de Teacher Profiles
- `teacher_profile_id` - ID do teacher profile
- `teacher_user_id` - ID do usuário professor
- `teacher_name` - Nome do professor

### 👶 Variáveis de Sheltered
- `sheltered_id` - ID da criança abrigada
- `sheltered_name` - Nome da criança
- `guardian_name` - Nome do responsável

## 🔐 Credenciais de Teste

### Admin (Padrão)
```json
{
  "email": "joao@example.com",
  "password": "password123"
}
```

### Variáveis de Teste Automáticas
As collections incluem scripts que automaticamente:
- Fazem login e salvam tokens
- Salvam IDs de usuários criados
- Configuram variáveis dinâmicas

## 🎯 Ambientes Recomendados

### Para Desenvolvimento
- Use `Orfanatonib_API_Environment.postman_environment.json`
- Configure `base_url` para `http://localhost:3000`

### Para Testes Específicos
- Use ambientes específicos por módulo
- Configure variáveis específicas do módulo

### Para Produção
- Crie cópia do ambiente geral
- Configure `base_url` para URL de produção
- Configure tokens de produção

---

**Environments - Sistema de Orfanato** 🌍
