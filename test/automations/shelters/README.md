# 🏠 Automação de Shelters

## 📚 Documentação Principal

**Guia Completo:** [`docs/documentation/SHELTERS_COMPLETE_GUIDE.md`](../../docs/documentation/SHELTERS_COMPLETE_GUIDE.md)

Este guia contém TUDO sobre Shelters:
- ✅ CRUD completo
- ✅ Media items e upload
- ✅ Routes e navegação
- ✅ Filtros e paginação
- ✅ Exemplos de código
- ✅ Troubleshooting

## 🚀 Scripts de Automação

### 1. Popular Banco de Dados
```bash
node automations/shelters/populate-shelters.js
```
Cria 10 shelters mockados com dados realistas.

### 2. Criar Media Items
```bash
node automations/shelters/create-media-items-sql.js
```
Adiciona imagens a todos os shelters via SQL.

### 3. Testar CRUD Completo
```bash
node automations/shelters/test-shelters-with-media.js
```
Executa 7 testes automatizados de criação, edição e listagem.

### 4. Automação Completa
```bash
node automations/shelters/shelters-complete-automation.js
```
Testa todas as funcionalidades do módulo.

## 📦 Arquivos

- `populate-shelters.js` - Popular banco
- `create-media-items-sql.js` - Criar media items via SQL
- `test-shelters-with-media.js` - Testes com media
- `test-media-items.js` - Testar listagem de media
- `list-databases.js` - Listar bancos disponíveis
- `shelters-complete-automation.js` - Automação completa
- `shelters-mock-data.json` - 10 shelters prontos
- `created-shelters-*.json` - Resultados de execução

## 🎯 Início Rápido

```bash
# 1. Popular banco
node automations/shelters/populate-shelters.js

# 2. Criar imagens
node automations/shelters/create-media-items-sql.js

# 3. Testar tudo
node automations/shelters/test-shelters-with-media.js
```

## 📊 Resultados Esperados

- ✅ 10 shelters criados
- ✅ 54+ media items no total
- ✅ Routes criadas (após migration)
- ✅ Descrições salvas
- ✅ Imagens vinculadas

## 🔗 Links Úteis

- **Guia Completo:** `../../docs/documentation/SHELTERS_COMPLETE_GUIDE.md`
- **Collection Postman:** `../../docs/collections/Shelters_API_Collection.postman_collection.json`
- **Migration SQL:** `../../database-migrations/add-routeId-to-shelters.sql`

## ⚠️ Pré-requisitos

1. API rodando (`npm run start:dev`)
2. Banco de dados configurado
3. Migration de `description` executada
4. Migration de `routeId` executada
5. Credenciais de admin válidas

## 💡 Dicas

- Use `populate-shelters.js` para dados iniciais
- Use collection do Postman para testes manuais
- Consulte o guia completo para exemplos detalhados
- Execute migrations antes de testar

**Tudo consolidado e organizado!** 📚✨