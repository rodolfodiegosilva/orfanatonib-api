# 🧪 Testes - Sistema de Orfanato

## 📋 Visão Geral

Esta pasta contém todos os scripts de teste para validação de funcionalidades do sistema de orfanato.

## 🗂️ Estrutura por Módulo

### 🔐 [Auth Module](auth/)
**Testes de Autenticação**
- Login/logout
- Registro de usuários
- Refresh tokens
- Validação de credenciais

### 👥 [Users Module](users/)
**Testes de Usuários**
- CRUD básico
- Filtros e paginação
- Ativação/desativação
- Validação de dados

### 🏠 [Shelters Module](shelters/)
**Testes de Abrigos**
- CRUD básico
- Filtros por localização
- Vinculação com líderes
- Validação de dados

### 👶 [Sheltered Module](sheltered/)
**Testes de Crianças Abrigadas**
- CRUD básico
- Filtros por idade e abrigo
- Dados de responsáveis
- Validação de dados

### 👨‍💼 [Leader Profiles Module](leader-profiles/)
**Testes de Líderes**
- `test-shelter-linking.js` - Teste de vinculação com abrigos

### 👨‍🏫 [Teacher Profiles Module](teacher-profiles/)
**Testes de Professores**
- `test-teacher-shelter-linking.js` - Teste de vinculação com abrigos

## 🚀 Como Executar

### Pré-requisitos
- Node.js instalado
- API rodando (`npm run start:dev`)
- Credenciais de admin configuradas
- Dados de teste criados

### Executar Testes
```bash
# Testar vinculação de líderes com abrigos
node tests/leader-profiles/test-shelter-linking.js

# Testar vinculação de professores com abrigos
node tests/teacher-profiles/test-teacher-shelter-linking.js
```

## 📊 Testes Disponíveis

### Leader Profiles
- ✅ **Vinculação Shelter-Leader** - Testa assign/unassign de abrigos
- ✅ **Movimentação de Abrigos** - Testa transferência entre líderes
- ✅ **Validação de Permissões** - Testa controle de acesso

### Teacher Profiles
- ✅ **Vinculação Shelter-Teacher** - Testa assign/unassign de abrigos
- ✅ **Validação de Permissões** - Testa controle de acesso
- ✅ **Filtros por Abrigo** - Testa busca de professores por abrigo

## 🔧 Configuração

### Credenciais Padrão
```json
{
  "email": "joao@example.com",
  "password": "password123"
}
```

### URL Base
```
http://localhost:3000
```

## 📝 Resultados dos Testes

### Teste de Vinculação Leader-Shelter
```
🚀 Iniciando teste de vinculação de shelters para leaders...

🔐 Fazendo login como admin...
✅ Login realizado com sucesso!

🏠 Listando shelters...
📊 Total de shelters: 10

👨‍💼 Listando leader profiles...
📊 Total de leader profiles: 10

🔗 TESTE DE VINCULAÇÃO LEADER-SHELTER:
   Shelter: Abrigo Central 1 (uuid-shelter-id)
   Leader: Maria Santos (uuid-leader-id)

📝 Vinculando shelter ao leader...
✅ Shelter vinculado ao leader com sucesso!

🔓 TESTE DE DESVINCULAÇÃO:
📝 Desvinculando shelter do leader...
✅ Shelter desvinculado do leader com sucesso!

🎉 Teste concluído!
```

### Teste de Vinculação Teacher-Shelter
```
🚀 Iniciando teste de vinculação de shelters para teachers...

🔐 Fazendo login como admin...
✅ Login realizado com sucesso!

🏠 Listando shelters...
📊 Total de shelters: 10

👨‍🏫 Listando teacher profiles...
📊 Total de teacher profiles: 41

🔗 TESTE DE VINCULAÇÃO TEACHER-SHELTER:
   Shelter: Abrigo Barra da Tijuca 10 (uuid-shelter-id)
   Teacher: Paulo Correia (uuid-teacher-id)

📝 Vinculando shelter ao teacher...
✅ Shelter vinculado ao teacher com sucesso!

🔓 TESTE DE DESVINCULAÇÃO:
📝 Desvinculando shelter do teacher...
✅ Shelter desvinculado do teacher com sucesso!

🎉 Teste concluído!
```

## 🔍 Validações Realizadas

### Autenticação
- ✅ Login com credenciais válidas
- ✅ Token JWT gerado corretamente
- ✅ Headers de autorização

### Endpoints
- ✅ Status codes corretos (200, 201, 404, 400)
- ✅ Estrutura de resposta válida
- ✅ Dados retornados corretos

### Funcionalidades
- ✅ Vinculação de abrigos
- ✅ Desvinculação de abrigos
- ✅ Validação de permissões
- ✅ Tratamento de erros

## 📁 Arquivos por Módulo

### Leader Profiles
- `test-shelter-linking.js` - Teste de vinculação com abrigos

### Teacher Profiles
- `test-teacher-shelter-linking.js` - Teste de vinculação com abrigos

## 🔄 Fluxo de Teste

1. **Setup** - Login e configuração inicial
2. **Listagem** - Busca dados existentes
3. **Teste Principal** - Executa funcionalidade
4. **Validação** - Verifica resultados
5. **Cleanup** - Limpa dados de teste
6. **Relatório** - Exibe resultados finais

## 🤝 Contribuição

Para adicionar novos testes:
1. Crie o arquivo na pasta do módulo correspondente
2. Siga o padrão: `test-[functionality].js`
3. Inclua logs detalhados
4. Trate erros adequadamente
5. Documente no README do módulo

---

**Testes - Sistema de Orfanato** 🧪
