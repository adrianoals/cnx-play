# Pagamento com Links Fixos da InfinitePay - Riscos e Limitações

## O que são "links fixos de pagamento"?

Os links fixos são URLs criados diretamente no painel da InfinitePay que direcionam o cliente para uma página de pagamento genérica. Exemplo:

- `https://invoice.infinitepay.io/plans/lucas/rZ6TVJIR3` (Plano Mensal)
- `https://app.infinitepay.io/plans/share/2g3U8skAh` (Plano Anual)

Quando o usuário clica nesse link, ele é redirecionado para a página da InfinitePay onde preenche os dados de cartão e conclui o pagamento.

---

## Qual é o problema?

### 1. Não sabemos QUEM pagou

O link é genérico. Qualquer pessoa que acesse o link pode pagar, e não existe nenhuma informação que conecte o pagamento ao cadastro do usuário na plataforma ConectaPlay.

**Na prática:** Se 10 pessoas pagam no mesmo dia, a equipe precisa manualmente olhar o extrato da InfinitePay, pegar nome/e-mail de quem pagou, e então liberar manualmente o acesso no sistema. Isso é trabalhoso e sujeito a erros.

### 2. Não há confirmação automática

Como não existe comunicação entre a InfinitePay e o ConectaPlay, o sistema não tem como saber que o pagamento foi aprovado. Então:

- O usuário paga, mas continua vendo "Aguardando Aprovação"
- Um administrador precisa entrar no painel, verificar e liberar manualmente
- Se o admin demora, o cliente fica frustrado

### 3. Fraude e liberação indevida

Um usuário pode dizer "eu já paguei" sem ter pagado de verdade, e se a verificação não for rigorosa, o acesso pode ser liberado indevidamente. Não há como cruzar automaticamente o pagamento com a conta do usuário.

### 4. Cancelamentos e reembolsos manuais

Se o cliente pedir cancelamento ou reembolso, todo o processo precisa ser feito manualmente, tanto no painel da InfinitePay quanto no sistema.

### 5. Não suporta renovação automática

Planos de assinatura (mensal/anual) precisam de cobrança recorrente. Com links fixos, não há como cobrar automaticamente no mês seguinte. O administrador teria que cobrar manualmente ou lembrar o cliente de pagar novamente.

---

## O que acontece hoje (fluxo atual com links fixos)

```
Usuário cria conta
    ↓
Escolhe um plano na plataforma
    ↓
Clica em "Confirmar Assinatura"
    ↓
Abre o link fixo da InfinitePay em nova aba
    ↓
Paga na InfinitePay (sem nenhuma referência ao cadastro dele)
    ↓
A plataforma NÃO sabe que ele pagou
    ↓
Admin precisa verificar manualmente e liberar o acesso
```

---

## O que seria o ideal (integração via API)

```
Usuário cria conta
    ↓
Escolhe um plano na plataforma
    ↓
O sistema gera um link de pagamento PERSONALIZADO (com ID do usuário)
    ↓
Usuário paga
    ↓
InfinitePay notifica o ConectaPlay automaticamente (webhook)
    ↓
O sistema libera o acesso automaticamente
    ↓
Renovações são cobradas automaticamente
```

---

## Resumo das diferenças

| Funcionalidade | Link Fixo (atual) | Integração API (ideal) |
|---|---|---|
| Saber quem pagou | Não | Sim |
| Liberação automática | Não | Sim |
| Cobrança recorrente | Não | Sim |
| Proteção contra fraude | Baixa | Alta |
| Cancelamento/reembolso | Manual | Automatizado |
| Esforço do administrador | Alto (diário) | Baixo (só exceções) |

---

## Recomendação

Para o **MVP (lançamento)**, os links fixos funcionam se a base de usuários for pequena (até ~50 pessoas) e se houver um administrador disponível para verificar pagamentos manualmente a cada dia.

Conforme a base crescer, a **integração via API** se torna essencial para:
- Escalar sem aumentar trabalho manual
- Evitar erros de liberação
- Oferecer uma experiência profissional ao cliente
- Permitir cobranças recorrentes automáticas

**Sugestão:** Lançar o MVP com links fixos e, em paralelo, iniciar a integração com a API da InfinitePay (ou outra gateway como Stripe, Mercado Pago) para a versão 2.0.

---

*Documento preparado pela equipe técnica do ConectaPlay.*
