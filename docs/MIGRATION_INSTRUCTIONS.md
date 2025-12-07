# 🔧 Instruções de Migração para Teams

## ⚠️ Problema

O TypeORM está tentando criar foreign keys para `team_id` nas tabelas `teacher_profiles` e `leader_profiles`, mas há dados existentes com valores inválidos que causam erro de constraint.

## ✅ Solução

Execute o script SQL de migração **ANTES** de iniciar a aplicação.

### Opção 1: Via MySQL CLI

```bash
# Conecte-se ao banco de dados
mysql -u seu_usuario -p orfanato-nib

# Execute o script
source docs/migration-fix-teams.sql
```

### Opção 2: Via arquivo SQL

```bash
mysql -u seu_usuario -p orfanato-nib < docs/migration-fix-teams.sql
```

### Opção 3: Via cliente MySQL (phpMyAdmin, MySQL Workbench, etc.)

1. Abra o arquivo `docs/migration-fix-teams.sql`
2. Copie todo o conteúdo
3. Execute no seu cliente MySQL

## 📋 O que o script faz

1. ✅ Cria a tabela `teams` se não existir
2. ✅ Limpa dados inválidos em `teacher_profiles` (define `team_id` como NULL para valores inválidos)
3. ✅ Limpa dados inválidos em `leader_profiles` (define `team_id` como NULL para valores inválidos)
4. ✅ Remove a coluna `shelter_id` de `teacher_profiles` se existir
5. ✅ Remove a coluna `shelter_id` de `leader_profiles` se existir
6. ✅ Adiciona a coluna `team_id` em `teacher_profiles` se não existir
7. ✅ Adiciona a coluna `team_id` em `leader_profiles` se não existir
8. ✅ Remove foreign keys antigas se existirem
9. ✅ Adiciona as foreign keys corretas para `team_id`
10. ✅ Cria índices para melhor performance

## 🚀 Após executar o script

1. Inicie a aplicação normalmente
2. O TypeORM não tentará criar as constraints novamente (elas já existirão)
3. Se o `synchronize` estiver habilitado, o TypeORM detectará que as estruturas já estão corretas

## ⚠️ Importante

- **Faça backup do banco de dados antes de executar o script**
- O script é **idempotente** (pode ser executado múltiplas vezes sem problemas)
- Se houver dados importantes em `shelter_id`, você precisará migrá-los manualmente para `team_id` antes de executar o script

## 🔄 Migração de Dados Existentes

Se você tem dados existentes em `shelter_id` que precisam ser migrados para `team_id`:

1. **Criar teams para cada shelter que tem líderes/professores:**
```sql
-- Para cada shelter que tem líderes ou professores, criar uma team padrão
INSERT INTO teams (id, name, description, shelter_id, createdAt, updatedAt)
SELECT 
  UUID() as id,
  CONCAT('Equipe - ', s.name) as name,
  'Equipe padrão criada durante migração' as description,
  s.id as shelter_id,
  NOW() as createdAt,
  NOW() as updatedAt
FROM shelters s
WHERE EXISTS (
  SELECT 1 FROM leader_profiles lp WHERE lp.shelter_id = s.id
) OR EXISTS (
  SELECT 1 FROM teacher_profiles tp WHERE tp.shelter_id = s.id
);
```

2. **Atualizar leader_profiles:**
```sql
UPDATE leader_profiles lp
INNER JOIN teams t ON t.shelter_id = lp.shelter_id
SET lp.team_id = t.id
WHERE lp.shelter_id IS NOT NULL;
```

3. **Atualizar teacher_profiles:**
```sql
UPDATE teacher_profiles tp
INNER JOIN teams t ON t.shelter_id = tp.shelter_id
SET tp.team_id = t.id
WHERE tp.shelter_id IS NOT NULL;
```

4. **Depois execute o script de migração principal**

---

**Última atualização:** 2024-11-29

