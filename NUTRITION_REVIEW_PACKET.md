# DietaSprint AI - Nutrition review packet

Questo documento prepara la revisione di dietista/nutrizionista/medico. Non e' validazione clinica.

## Logica attuale da validare

| Area | Implementazione | File |
| --- | --- | --- |
| BMR | Formula Mifflin-St Jeor | `src/lib/calories.ts` |
| TDEE | Moltiplicatori sedentary/light/moderate/active | `src/lib/calories.ts` |
| Deficit | maintain 0%, mild 15%, standard 20%, aggressive 25% | `src/lib/calories.ts` |
| Soglie calorie | Warning sotto 1000 kcal, 1200 donna, 1500 uomo | `src/lib/calories.ts` |
| Screening | Blocco per gravidanza, allattamento, diabete, disturbi alimentari, renale, cardiaco, bariatrica, farmaci | `src/lib/medicalScreening.ts` |
| Macro | Range per chetogenica, mediterranea, low carb, bilanciata, vegetariana | `src/lib/macroTargets.ts` |
| Pasti | Template locali con ingredienti, kcal e macro approssimativi | `src/lib/mealTemplates.ts` |
| Allergie | Esclusione ingredienti per glutine, lattosio, uova, pesce, soia, frutta a guscio | `src/lib/plannerPreferences.ts` |
| Sostituzioni | Alternative dello stesso tipo pasto, dieta compatibile e calorie vicine | `src/lib/generateMealPlan.ts` |

## Domande per revisione

1. Le soglie di warning calorie sono adeguate per un prodotto non medico?
2. I casi di blocco screening sono sufficienti o vanno ampliati?
3. La chetogenica va mantenuta, limitata o rimossa dalla beta pubblica?
4. I range macro per dieta sono accettabili come indicazioni orientative?
5. I template pasti hanno combinazioni e porzioni realistiche?
6. Le allergie strutturate sono abbastanza prudenziali per MVP?
7. Le diciture "non sostituisce professionista" sono sufficientemente visibili?

## Definition of done nutrizionista

- Formule calorie approvate o corrette.
- Soglie di sicurezza approvate o corrette.
- Screening iniziale approvato o ampliato.
- Range macro per dieta approvati o corretti.
- Template pasti revisionati almeno per beta.
- Lista di claim vietati e disclaimer finali confermati.

## Esito richiesto

| Area | Approvato | Modifiche richieste | Note |
| --- | --- | --- | --- |
| Calorie/BMR/TDEE |  |  |  |
| Guardrail calorie |  |  |  |
| Screening salute |  |  |  |
| Macro per dieta |  |  |  |
| Template pasti |  |  |  |
| Sostituzioni |  |  |  |
