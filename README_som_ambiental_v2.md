# Som Ambiental v2 - Guia rapido

## O que mudou em relacao a versao anterior

1. **Salas individuais por aluno**: o codigo da sala agora deve ser pessoal (ex: `SOM_ANA`, `SOM_JOAO`). Cada aluno coleta seus proprios dados em uma "sala" so dele. O professor pode entrar em qualquer sala para ver as coletas de cada aluno.

2. **Perguntas contextuais na coleta**: alem de ambiente, periodo e replica, o aluno responde 4 perguntas curtas antes de medir:
   - Pessoas no raio de 10 metros (0-2, 3-10, 11-30, 31-100, 100+)
   - Tipo de local (residencial, educacional, comercial, via residencial, via arterial, espaco aberto, aglomeracao)
   - Fluxo de veiculos nos 30s (nenhum, poucos, moderado, intenso)
   - Fonte dominante do som (silencio, vozes, trafego, construcao, natureza, musica, mista)

3. **Auto-classificacao em 8 situacoes comparaveis com Europa**: cada coleta e automaticamente enquadrada em uma das 8 "situacoes de vida" que correspondem a categorias da diretiva europeia de ruido (END 2002/49/EC):

| ID | Situacao | Faixa EEA de referencia |
|----|----------|-------------------------|
| 1  | Quarto noturno residencial | Lnight 50-54 dB |
| 2  | Ambiente domestico diurno | Lden 50-54 dB |
| 3  | Sala de aula ou educacional | Lden 55-59 dB |
| 4  | Rua residencial tranquila | Lden 55-59 dB |
| 5  | Rua comercial com trafego | Lden 60-64 dB |
| 6  | Praca ou area aberta | Lden 55-59 dB |
| 7  | Trafego intenso ou rodovia | Lden 65-69 dB |
| 8  | Aglomeracao (mercado, evento) | Lden 60-64 dB |

4. **Comparacao com benchmark europeu na aba Resultados**: o aluno ve uma tabela mostrando em quais faixas de dB suas coletas caem, comparado com a % de pessoas expostas a cada faixa em 435 aglomeracoes urbanas europeias (32 paises).

5. **Exportacao direta para o Dossie Estatistico**: novo botao "Baixar para Dossie Estatistico (.csv) + Europa" que gera um CSV no formato `Grupo, Valor` compativel com o Dossie, contendo as coletas do aluno + observacoes equivalentes geradas a partir das faixas europeias, prontas para teste t, ANOVA ou Kruskal-Wallis.

## Como publicar no GitHub Pages

1. Va no repositorio `ernandes-sobreira/som-ambiental`
2. Substitua o `index.html` antigo por este novo
3. Mantenha `sw.js` e `manifest.json` como estao
4. Aguarde alguns minutos o GitHub Pages propagar
5. Acesse `https://ernandes-sobreira.github.io/som-ambiental/`

Atencao: apos publicar, peca aos alunos para recarregar a pagina com **Ctrl+F5** (forcar recarga sem cache), senao o service worker pode servir a versao antiga.

## Como os alunos usam

### Fase 1: coleta

1. Aluno abre a plataforma no celular
2. Digita seu nome e um codigo personalizado (ex: `SOM_ANA`)
3. Escolhe "Sou aluno", entra
4. Para cada coleta:
   - Escolhe ambiente (Quarto, Sala de Aula, etc.)
   - Escolhe periodo do dia
   - **Responde as 4 perguntas contextuais**
   - Pressiona "Iniciar" e mede por 30 segundos
   - Clica "Salvar coleta"
   - A plataforma avisa: "Coleta salva! [icone] [nome da situacao]"

### Fase 2: analise com Dossie Estatistico

1. Na aba "Resultados", olha a comparacao com a Europa
2. Na aba "Minhas coletas", clica em "Baixar para Dossie Estatistico (.csv) + Europa"
3. Dois arquivos sao baixados:
   - `dossie_[nome]_vs_europa.csv` - o CSV no formato do Dossie
   - `dossie_[nome]_metadados.txt` - metadados explicativos
4. Abre o Dossie Estatistico
5. Importa o CSV
6. Roda os testes (Modelo 1 para comparar uma situacao Caceres vs Europa, Modelo 2 para ANOVA entre varias situacoes)

## Como o CSV e construido

Para cada situacao em que o aluno tem coletas, dois grupos sao gerados:

```
Grupo,Valor
Caceres_S3_ana,58.2      <- medicao real do aluno na sala de aula
Caceres_S3_ana,62.1      <- outra medicao real
Europa_S3,56.3            <- observacao equivalente da faixa EEA 55-59 dB
Europa_S3,57.8            <- amostrada uniformemente em torno do ponto medio
Europa_S3,55.9            <- (ponto medio +- 2 dB)
...
```

Importante: o grupo Europa NAO contem medicoes reais individuais (a EEA fornece apenas contagem agregada de pessoas por faixa). Sao observacoes equivalentes reconstruidas estatisticamente a partir da faixa da diretiva europeia, com o unico proposito de permitir teste estatistico grupo-a-grupo. O que e cientificamente valido: a media e a faixa (5 dB de largura) sao preservadas. Isso esta documentado no arquivo de metadados que acompanha o CSV.

## Fonte dos dados europeus

European Environment Agency (EEA) - Environmental Noise Directive 2002/49/EC
Dataset: Summary END 2022 (cutoff 2024-11-18)
Cobertura: 435 aglomeracoes urbanas em 32 paises
URL: https://www.eea.europa.eu/en/datahub

Total de pessoas expostas cobertas pelos dados:
- Lden (dia-tarde-noite) - ruido de estrada: 63,325,900 pessoas
- Lnight (noite) - ruido de estrada: 43,552,400 pessoas

## Arquitetura tecnica

- `index.html` - plataforma Som Ambiental (unica pagina, tudo embutido)
- `sw.js` - service worker para funcionamento offline (mantido do original)
- `manifest.json` - PWA metadata (mantido do original)

Dependencias externas (carregadas em runtime):
- Firebase Realtime Database (som-ambiental-default-rtdb)
- Chart.js via CDN
- Nenhuma outra

Os dados da EEA estao embutidos no proprio index.html (bundle de ~3KB) - nenhuma API externa e consultada para a comparacao europeia. Isso torna o app robusto mesmo com internet instavel.

## Testes realizados

Antes da entrega, os seguintes testes foram executados:

1. Sintaxe JavaScript validada com `node -c` - zero erros
2. Logica de classificacao de 6 cenarios testada - 6/6 OK
3. Mapeamento dB -> faixa EEA testado em 6 valores - OK
4. Simulacao completa de `exportDossie()` com 5 coletas -> CSV gerado corretamente

## Limitacoes honestas

1. **O grupo Europa nao e dado primario**: e reconstrucao de faixa agregada. Isto esta documentado no arquivo de metadados. Para pesquisa primaria (nao para ensino), usar outras fontes.

2. **Calibracao de microfones varia**: celulares diferentes dao valores absolutos diferentes. Comparacoes relativas (Caceres vs Europa) tem mais valor que valores absolutos.

3. **Cada coleta e pontual (30s)**: o Lden europeu e uma media de 24h. Comparar diretamente uma medicao de 30s com Lden tem essa assimetria.

4. **Mapeamento situacao <-> faixa EEA e heuristico**: baseado em literatura e normas, mas nao e validado empiricamente para Caceres especificamente.

Todas essas limitacoes devem ser discutidas em sala com os alunos - podem ate virar tema da aula.
