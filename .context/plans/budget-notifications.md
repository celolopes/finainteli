---
status: active
generated: 2026-01-22
title: "Feature F2: Notificações de Orçamento"
summary: "Implementar sistema de notificações de orçamento que alerta o usuário quando atinge limites configuráveis de gastos por categoria"
priority: should-have
complexity: medium
estimated_hours: 7
agents:
  - type: "feature-developer"
    role: "Implementar lógica de monitoramento e notificações"
  - type: "mobile-specialist"
    role: "Configurar expo-notifications e permissões"
  - type: "test-writer"
    role: "Criar testes para lógica de alertas"
docs:
  - "project-overview.md"
  - "architecture.md"
---

# Feature F2: Notificações de Orçamento

## 🎯 Objetivo

Implementar um sistema de notificações locais que alerta o usuário quando seus gastos em uma categoria atingem limites configuráveis (50%, 80%, 100% do orçamento definido).

## 📋 Escopo

### Incluído

- Definição de orçamento por categoria
- Alertas em 3 níveis (50%, 80%, 100%)
- Notificações push locais
- Tela de configuração de orçamentos
- Persistência no Supabase

### Excluído (Futuro)

- Notificações remotas via Edge Functions
- Orçamento total (não por categoria)
- Relatórios de cumprimento de orçamento

## 📦 Entregáveis

### Fase 1: Infraestrutura (2h)

#### 1.1 - Setup expo-notifications

```bash
npx expo install expo-notifications expo-device
```

#### 1.2 - Configuração app.json

```json
{
  "expo": {
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#4CAF50"
        }
      ]
    ]
  }
}
```

#### 1.3 - Serviço de Notificações

```
src/services/notifications.ts
├── requestPermissions()
├── scheduleLocalNotification()
├── cancelNotification()
└── getBadgeCount()
```

### Fase 2: Banco de Dados (1h)

#### 2.1 - Migração: Tabela `budgets`

```sql
CREATE TABLE public.budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL,
  period VARCHAR(20) DEFAULT 'monthly', -- monthly, weekly
  alert_50 BOOLEAN DEFAULT true,
  alert_80 BOOLEAN DEFAULT true,
  alert_100 BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, category_id, period)
);

-- RLS
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own budgets" ON public.budgets
  FOR ALL USING (auth.uid() = user_id);
```

### Fase 3: Lógica de Negócio (2h)

#### 3.1 - Hook useBudgetMonitor

```typescript
// src/hooks/useBudgetMonitor.ts
export const useBudgetMonitor = () => {
  // Busca orçamentos do usuário
  // Calcula gastos atuais por categoria
  // Verifica se algum limite foi atingido
  // Dispara notificação se necessário
  // Marca notificação como enviada (evita duplicatas)
};
```

#### 3.2 - BudgetService

```typescript
// src/services/budget.ts
export const BudgetService = {
  getBudgets(userId: string): Promise<Budget[]>;
  setBudget(userId: string, categoryId: string, amount: number): Promise<Budget>;
  deleteBudget(budgetId: string): Promise<void>;
  checkBudgetStatus(userId: string): Promise<BudgetStatus[]>;
};
```

### Fase 4: Interface do Usuário (2h)

#### 4.1 - Tela de Orçamentos

```
app/(app)/settings/budgets.tsx
├── Lista de categorias com orçamento definido
├── Barra de progresso (gasto vs orçamento)
├── Botão para adicionar/editar orçamento
└── Toggle para ativar/desativar alertas
```

#### 4.2 - Modal de Definição

```
src/components/budgets/BudgetModal.tsx
├── Seletor de categoria
├── Input de valor
├── Checkboxes para níveis de alerta
└── Botões Salvar/Cancelar
```

## 🔄 Fluxo de Funcionamento

```
1. Usuário define orçamento de R$500 para "Alimentação"
   ↓
2. Usuário adiciona transação de R$250 (50%)
   ↓
3. useBudgetMonitor detecta limite atingido
   ↓
4. NotificationService.scheduleLocalNotification({
     title: "Atenção com seus gastos!",
     body: "Você já gastou 50% do orçamento de Alimentação"
   })
   ↓
5. Usuário recebe push notification
```

## ✅ Critérios de Sucesso

- [ ] Usuário pode definir orçamento por categoria
- [ ] Alertas disparam nos limites corretos (50%, 80%, 100%)
- [ ] Notificações aparecem mesmo com app em background
- [ ] Usuário pode desativar alertas individuais
- [ ] Dados persistem entre sessões

## 📊 Estimativa Detalhada

| Tarefa                   | Tempo   |
| ------------------------ | ------- |
| Setup expo-notifications | 30min   |
| Migração banco de dados  | 30min   |
| NotificationService      | 1h      |
| BudgetService            | 1h      |
| useBudgetMonitor hook    | 1h      |
| Tela de Orçamentos       | 1.5h    |
| BudgetModal              | 1h      |
| Testes básicos           | 30min   |
| **Total**                | **~7h** |

## 🔗 Dependências

- `expo-notifications` (a instalar)
- `expo-device` (a instalar)
- Tabela `categories` (existe)
- Tabela `transactions` (existe)

## 📝 Notas de Implementação

1. **Deduplicação**: Usar AsyncStorage para marcar alertas já enviados no dia
2. **Verificação**: Rodar check no `useFocusEffect` do Dashboard e ao criar transação
3. **Background**: Notificações locais não precisam de servidor
