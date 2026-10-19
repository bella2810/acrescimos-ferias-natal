# Acréscimos de Férias, Subsídio de Férias e Natal 2026

Aplicação web gratuita para controlar se os gastos com **subsídio de Natal, férias e subsídio de férias de 2026** estão corretamente acrescidos na contabilidade (SNC, Código do Trabalho português).

**Usar a app:** https://bella2810.github.io/acrescimos-ferias-natal/

## Como usar

1. Escolha o mês que está a fechar.
2. Importe a relação de trabalhadores, o resumo do processamento e o balancete do mês.
3. Registe as baixas e saídas do mês (ou carregue em "Não houve").
4. Leia o resultado: se está contabilizado, porquê, e quanto acrescer no mês seguinte.

O detalhe técnico está em "Análise detalhada". O botão "Imprimir relatório" gera o relatório de fecho (conferências, explicação e lançamentos) para imprimir ou guardar em PDF.

## O que faz

- **Análise do mês:** compara o acréscimo estimado para o mês com o lançado (movimentos do período do balancete).
- **Conferência acumulada:** compara o gasto acumulado até ao fim do período com o acrescido nas contas de gasto (ex.: 6381x) e o saldo das contas 2722.
- **Explicação das diferenças:** identifica automaticamente as causas, trabalhador a trabalhador (admissões e saídas em 2026, taxa de encargos, SN processado).
- **Saldo de 2025 por utilizar:** projeta o saldo de anos anteriores nas contas 2722 até 31/12.
- **Sugestão de acréscimo mensal** até dezembro, com lançamento proposto.
- **Baixas e saídas:** registo rápido e quadro com o efeito de cada ocorrência no acréscimo do mês.
- **Saídas:** proporcionais de 2026 tratados conforme o lançamento do pagamento na cessação (via 2722 ou em gasto); a sugestão mensal para de acrescer após a saída.
- **Baixas prolongadas:** os dias de baixa não contam para o subsídio de Natal.
- **Conferência do processado:** compara o subsídio de Natal do processamento com a conta de gasto do balancete (ex.: 63213).

## Ficheiros que aceita (xlsx, xls, csv)

1. Relação de trabalhadores: nº, nome, data de admissão, salário base (opcional: data de saída, início e fim de baixa prolongada).
2. Resumo do processamento: total do subsídio de Natal processado em 2026, ou valores por trabalhador.
3. Balancete com movimentos do período e saldos.

As colunas são reconhecidas automaticamente e podem ser ajustadas na importação.

## Privacidade

A app corre inteiramente no browser. Os ficheiros importados **não são enviados para nenhum servidor**; ficam apenas no computador de quem a usa (armazenamento local do browser).

## Regras de cálculo

- Subsídio de Natal (art. 263.º CT): salário × meses de 2026 / 12, menos o já processado.
- Férias e subsídio de férias (arts. 237.º, 245.º, 264.º CT): vencem a 1/1/2027 e são gasto de 2026; cada um vale salário × meses / 12.
- Encargos: TSU entidade + seguro de acidentes de trabalho + outros, sobre os acréscimos.
- Meses incompletos contam pela proporção de dias de calendário.

Os resultados são uma ferramenta de apoio e devem ser validados por um contabilista certificado.

## Licença

MIT — livre para usar, copiar e modificar.
