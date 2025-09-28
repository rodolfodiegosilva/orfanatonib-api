# 📖 Documentation - Documentação da API

## 📋 Visão Geral

Esta pasta contém toda a documentação detalhada da API do sistema de orfanato.

## 📁 Documentações Disponíveis

### 🔐 Auth Module
- `Auth_API_Documentation.md` - Documentação completa do módulo Auth
- `Auth_Collection_Usage_Example.md` - Exemplos de uso da collection

### 👥 Users Module
- `User_API_Documentation.md` - Documentação completa do módulo Users
- `User_API_Usage_Examples.md` - Exemplos de uso detalhados

### 🏠 Shelters Module
- `Shelters_API_Documentation.md` - Documentação completa do módulo Shelters

### 👶 Sheltered Module
- `Sheltered_API_Documentation.md` - Documentação completa do módulo Sheltered

### 👨‍💼 Leader Profiles Module
- `Leader_Profiles_API_Documentation.md` - Documentação completa do módulo Leader Profiles

## 📊 Conteúdo das Documentações

### ✅ Informações Incluídas
- **Visão geral** do módulo
- **Endpoints disponíveis** com descrições
- **Parâmetros de entrada** detalhados
- **Exemplos de request** completos
- **Exemplos de response** detalhados
- **Códigos de erro** e tratamentos
- **Autenticação e autorização**
- **Filtros e paginação**
- **Relacionamentos** entre entidades

### 🎯 Estrutura Padrão
1. **Visão Geral** - Introdução ao módulo
2. **Endpoints** - Lista de todos os endpoints
3. **Parâmetros** - Detalhes de entrada
4. **Exemplos** - Requests e responses
5. **Códigos de Erro** - Tratamento de erros
6. **Autenticação** - Como autenticar
7. **Relacionamentos** - Conexões com outros módulos

## 🚀 Como Usar

### Leitura da Documentação
1. Acesse o arquivo do módulo desejado
2. Siga a estrutura padrão
3. Use os exemplos como referência
4. Consulte códigos de erro quando necessário

### Integração com Collections
- Use junto com as collections do Postman
- Os exemplos correspondem aos endpoints das collections
- Mantenha sincronização entre documentação e collections

### Desenvolvimento
- Consulte antes de implementar novos endpoints
- Use como referência para manter consistência
- Atualize quando houver mudanças na API

## 📋 Padrões de Documentação

### Request Examples
```json
{
  "name": "João Silva",
  "email": "joao@example.com",
  "phone": "+5511999999999",
  "password": "password123",
  "role": "teacher"
}
```

### Response Examples
```json
{
  "id": "uuid-user",
  "name": "João Silva",
  "email": "joao@example.com",
  "active": true,
  "createdAt": "2025-09-27T21:00:00.000Z"
}
```

### Error Examples
```json
{
  "statusCode": 400,
  "message": ["email must be a valid email"],
  "error": "Bad Request"
}
```

## 🔄 Manutenção

### Atualizações
- Mantenha sincronizado com mudanças na API
- Atualize exemplos quando necessário
- Revise códigos de erro periodicamente

### Versionamento
- Use tags de versão nos arquivos
- Mantenha histórico de mudanças
- Documente breaking changes

---

**Documentation - Sistema de Orfanato** 📖
