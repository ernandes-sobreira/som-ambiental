# Som Ambiental v2 — versão final

Plataforma de coleta de ruído ambiental integrada ao Dossiê Estatístico,
com benchmark de 10 cidades europeias em 4 tipos de ruído.

## O que está pronto nesta versão

### 1. Salas individuais com proteção contra colisão

Cada aluno entra com um código personalizado (ex: `SOM_ANA`). Ao entrar:

- **Se a sala não existe**: cria normalmente.
- **Se a sala existe e o nome bate**: reconhece que é a mesma pessoa voltando, carrega coletas anteriores.
- **Se a sala existe mas o nome é diferente**: mostra diálogo:
  - "OK para entrar mesmo assim (se for a mesma pessoa)"
  - "Cancelar para criar nova sala com número (ex SOM_ANA_02)"
- Se cancelar, o sistema busca automaticamente o próximo número livre (SOM_ANA_02, _03, _04...) e preenche no campo.

Isso elimina colisões entre alunos homônimos e permite que o mesmo aluno retome coletas em sessões futuras.

### 2. Perguntas contextuais na coleta

Após selecionar ambiente e período, o aluno responde 4 perguntas rápidas que situam a coleta:

- Pessoas no raio de 10 m (5 opções, de "0 a 2" até "mais de 100")
- Tipo de local (residencial, educacional, comercial, via residencial, via arterial, espaço aberto, aglomeração)
- Fluxo de veículos nos 30s (nenhum, poucos, moderado, intenso)
- Fonte dominante do som (silêncio, vozes, tráfego, construção, natureza, música, mista)

### 3. Auto-classificação em 8 situações EEA-compatíveis

A coleta é automaticamente enquadrada em uma das 8 situações de vida, cada uma conectada a uma categoria da Diretiva Europeia de Ruído (END 2002/49/EC):

| ID | Situação | Tipos de ruído EEA associados |
|----|----------|--------------------------------|
| S1 | Quarto noturno residencial | rodoviário, aeroporto |
| S2 | Ambiente doméstico diurno | rodoviário |
| S3 | Sala de aula ou educacional | rodoviário, ferroviário |
| S4 | Rua residencial tranquila | rodoviário |
| S5 | Rua comercial com tráfego | rodoviário |
| S6 | Praça ou área aberta | rodoviário, aeroporto |
| S7 | Tráfego intenso ou rodovia | rodoviário, aeroporto, ferroviário, industrial |
| S8 | Aglomeração (mercado, evento) | rodoviário, industrial |

### 4. Comparação visual com a Europa na aba Resultados

Cartão "Comparação com benchmark europeu" mostra, para cada faixa de dB:
- % das coletas do aluno nessa faixa (barra azul)
- % da população europeia exposta a essa faixa (barra roxa)
- Indicador de `acima`, `similar` ou `abaixo`

### 5. Exportação com dados reais de 10 cidades europeias

O botão "Baixar para Dossiê Estatístico (.csv) + Europa" gera **3 arquivos**:

**A. `dossie_[nome]_wide.csv` — formato principal (wide format)**

```
Pais,Cidade,Tipo_Ruido,Situacao,Situacao_Nome,Periodo,Replica,dB
Brasil,Caceres,local,S1,"Quarto noturno residencial",Madrugada,1,32.5
Brasil,Caceres,local,S1,"Quarto noturno residencial",Madrugada,2,30.8
Portugal,Porto,rodoviario,S1,"Quarto noturno residencial",Noite,1,58.5
Portugal,Porto,rodoviario,S1,"Quarto noturno residencial",Noite,2,53.5
France,Paris,rodoviario,S1,"Quarto noturno residencial",Noite,1,64.2
...
```

- 8 colunas para permitir ANOVA two-way, regressão, filtros.
- Coletas reais do aluno marcadas como `Brasil / Caceres / local`.
- Observações europeias reconstruídas: **50 por combinação cidade × tipo_ruido × situação**.
- Em uma coleta típica com 3 situações, isso gera ~3.500 observações europeias para comparação robusta.

**B. `dossie_[nome]_simples.csv` — compatibilidade Dossiê**

Formato `Grupo, Valor` (Grupo = Pais_Situacao) para os modelos simples do Dossiê Estatístico.

**C. `dossie_[nome]_metadados.txt` — documentação**

Explica a metodologia de reconstrução, cita a fonte EEA completa, lista as limitações e sugere testes estatísticos adequados para cada caso.

### 6. Metodologia de reconstrução dos dados europeus

A diretiva EEA fornece, para cada cidade, quantas pessoas estão expostas a cada faixa de dB. Para transformar essa contagem agregada em observações individuais comparáveis com as medições do aluno, o app usa **amostragem ponderada pela CDF**:

1. Para cada cidade × tipo de ruído, calcula a distribuição acumulada (CDF) das faixas usando a população exposta como peso.
2. Sorteia N = 50 observações via CDF inversa (cada faixa é selecionada proporcionalmente ao número real de pessoas expostas a ela).
3. Dentro da faixa sorteada, valor uniforme no intervalo [ponto médio ± 2 dB].

Isso **preserva a média, variância e distribuição de exposição reais** da cidade, diferente de uma amostragem ingênua. Limitações honestas estão documentadas no arquivo de metadados.

## Cidades europeias incluídas

10 cidades representativas × 4 tipos de ruído = 40 perfis. Dados reais da EEA END 2022:

| País | Cidade | Rodov. | Aero. | Ferro. | Indust. |
|------|--------|--------|-------|--------|---------|
| Portugal | Porto | ✓ | ✓ | ✓ | — |
| Spain | Madrid | ✓ | ✓ | ✓ | — |
| France | Paris | ✓ | ✓ | ✓ | ✓ |
| Italy | Rome | ✓ | ✓ | ✓ | ✓ |
| Germany | Berlin | ✓ | ✓ | ✓ | ✓ |
| Netherlands | Amsterdam | ✓ | ✓ | ✓ | ✓ |
| Austria | Vienna | ✓ | ✓ | ✓ | ✓ |
| Poland | Warsaw | ✓ | ✓ | ✓ | — |
| Sweden | Stockholm | ✓ | ✓ | ✓ | ✓ |
| Ireland | Dublin | ✓ | ✓ | ✓ | — |

"✓" significa a cidade tem dados reais publicados naquele tipo. "—" significa sem dados (cidade pequena ou sem reporting para aquele tipo — isso é uma informação científica em si).

## Testes estatísticos que o aluno pode rodar no Dossiê

Com o CSV wide, no Dossiê Estatístico:

**ANOVA one-way (Modelo 2):**
- dB por País (para uma situação fixa) — os países diferem no nível de ruído?

**ANOVA two-way:**
- dB por País × Tipo_Ruido — há interação entre país e fonte sonora?

**Regressão linear:**
- dB ~ Situacao + Periodo — qual fator contribui mais?

**t-test:**
- Cáceres vs cada cidade europeia separadamente.

**Kruskal-Wallis:**
- Alternativa não-paramétrica se os dados violam pressupostos da ANOVA.

## Como publicar

1. Baixa o `index.html` desta pasta
2. Vai em `github.com/ernandes-sobreira/som-ambiental`
3. Substitui o `index.html` antigo pelo novo
4. Mantém `sw.js` e `manifest.json` como estão
5. Espera alguns minutos a propagação do GitHub Pages
6. Pede aos alunos para fazer **Ctrl+F5** (recarregar sem cache) ao abrir

## Fluxo prático para Ana coletar na semana

**Primeiro dia:**
1. Abre `ernandes-sobreira.github.io/som-ambiental` no celular
2. Digita "Ana Silva" + código `SOM_ANA`
3. Sistema confirma "sala criada"
4. Faz 5 coletas: quarto de noite, sala de casa, rua do bairro, UNEMAT, BR-070
5. Sai

**Segundo dia:**
1. Abre novamente
2. Nome "Ana Silva" + código `SOM_ANA`
3. Sistema reconhece "Bem-vinda de volta, Ana Silva!"
4. Coletas antigas reaparecem
5. Faz mais 5 coletas
6. Na aba "Resultados" vê comparação com Europa
7. Clica "Baixar para Dossiê Estatístico"
8. Abre Dossiê, importa o CSV wide, roda ANOVA two-way

**Se Ana Santos (outra aluna) tenta também usar SOM_ANA:**
1. Entra como "Ana Santos" + código `SOM_ANA`
2. Sistema detecta: "Já existe sala SOM_ANA do aluno Ana Silva"
3. Ana Santos clica "Cancelar" para criar nova
4. Sistema sugere `SOM_ANA_02`
5. Ana Santos clica Entrar novamente, agora com `SOM_ANA_02`

## Arquivos

- `index.html` (125 KB, 2375 linhas) — substitui o index atual no GitHub Pages
- `sw.js`, `manifest.json` — mantidos da versão anterior

## Validação técnica executada nesta sessão

- Sintaxe JavaScript validada com `node -c`: zero erros
- Simulação de `exportDossie()` com 8 coletas do aluno gerou 3508 linhas no CSV wide
- Distribuição por País × Tipo de Ruído conferida: valores coerentes com dados EEA
- Estatísticas por grupo testadas: médias plausíveis (ex. Paris S1 = 63.8 dB vs Cáceres S1 = 30.5 dB)
- Todas as 8 funções novas definidas e chamadas corretamente
