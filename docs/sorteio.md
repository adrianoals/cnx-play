  Como funciona o sorteio automático                                                                           
                                                                                                          
  A Edge Function generate-daily-matches roda todo dia às 20h BRT (via pg_cron) e gera os matches para amanhã: 
                                                                                                               
  1. Para cada slot (07:00 e 19:00), busca quem marcou disponibilidade                                         
  2. Filtra: só usuários ativos, com empresa primária e categoria definida                                     
  3. Exclui quem já tem match para aquele dia/slot                                                             
  4. Usa um algoritmo greedy com scoring:                                                                      
    - +20 pts — nunca se conectaram antes
    - +10 pts — categorias diferentes (cross-segment)
    - +10 pts — se conectaram, mas faz >3 dias
    - -5 pts — se conectaram nos últimos 3 dias
  5. Embaralha aleatoriamente, depois para cada usuário escolhe o melhor candidato por score
  6. Insere matches bilaterais + histórico + notificações