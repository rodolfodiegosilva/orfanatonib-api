# 🤖 Automações - Sistema de Orfanato

## 📋 Visão Geral

Esta pasta contém todos os scripts de automação para criação em massa de dados no sistema de orfanato.

## 🗂️ Estrutura por Módulo

### 🔐 [Auth Module](auth/)
**Automações de Autenticação**
- Criação em massa de usuários
- Configuração de credenciais
- Validação de dados

### 👥 [Users Module](users/)
**Automações de Usuários**
- Criação de usuários em massa
- Ativação/desativação em lote
- Importação de dados

### 🏠 [Shelters Module](shelters/)
**Automações de Abrigos**
- Criação de abrigos em massa
- Vinculação com endereços
- Configuração de líderes

### 👶 [Sheltered Module](sheltered/)
**Automações de Crianças Abrigadas**
- Criação de registros em massa
- Vinculação com abrigos
- Dados de responsáveis

### 👨‍💼 [Leader Profiles Module](leader-profiles/)
**Automações de Líderes**
- `create-leader-profiles-smart.js` - Criação inteligente de perfis de líderes

### 👨‍🏫 [Teacher Profiles Module](teacher-profiles/)
**Automações de Professores**
- `create-teacher-profiles-automation.js` - Criação de perfis de professores

## 🚀 Como Executar

### Pré-requisitos
- Node.js instalado
- API rodando (`npm run start:dev`)
- Credenciais de admin configuradas

### Executar Automações
```bash
# Criar perfis de líderes
node automations/leader-profiles/create-leader-profiles-smart.js

# Criar perfis de professores
node automations/teacher-profiles/create-teacher-profiles-automation.js
```

## 📊 Dados Criados

### Leader Profiles
- ✅ 10 perfis de líderes criados
- ✅ Vinculação com usuários existentes
- ✅ Validação de dados

### Teacher Profiles
- ✅ 40 perfis de professores criados
- ✅ Vinculação com usuários existentes
- ✅ Validação de dados

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

## 📝 Logs e Resultados

### Logs de Sucesso
- ✅ Login realizado com sucesso
- ✅ Usuários encontrados: X
- ✅ Perfis criados: X
- ✅ Processo concluído

### Tratamento de Erros
- ❌ Erro de autenticação
- ❌ Usuários não encontrados
- ❌ Falha na criação de perfis
- ❌ Erro de validação

## 🔄 Fluxo de Execução

1. **Autenticação** - Login com credenciais de admin
2. **Busca de Dados** - Lista usuários existentes
3. **Validação** - Verifica dados necessários
4. **Criação** - Cria perfis em massa
5. **Relatório** - Exibe resultados finais

## 📁 Arquivos por Módulo

### Leader Profiles
- `create-leader-profiles-smart.js` - Automação principal

### Teacher Profiles
- `create-teacher-profiles-automation.js` - Automação principal

## 🤝 Contribuição

Para adicionar novas automações:
1. Crie o arquivo na pasta do módulo correspondente
2. Siga o padrão de nomenclatura: `create-[module]-automation.js`
3. Inclua logs detalhados
4. Trate erros adequadamente
5. Documente no README do módulo

---

**Automações - Sistema de Orfanato** 🤖
