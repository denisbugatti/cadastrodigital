# Conditional Logic Expansion Notes

## Current State
- TypeScript: No errors
- ConditionalLogic interface now has: branches (for choice-based), rules (for condition-based), defaultGoTo
- ConditionOperator type: is_answered, is_empty, equals, not_equals, contains, not_contains, greater_than, less_than, greater_equal, less_equal
- ConditionalRule interface: id, operator, value, goToQuestionId
- hasConditionalLogic: only true for multiple-choice, dropdown, yes-no

## Files to modify
1. builderTypes.ts - DONE: Added ConditionalRule, ConditionOperator, expanded ConditionalLogic
2. builderTypes.ts - TODO: Set hasConditionalLogic: true for ALL question types (except welcome, thank-you, statement)
3. BuilderConfigPanel.tsx - TODO: Expand logic tab to show condition-based rules for non-choice questions
4. formTypes.ts - TODO: Update conditionalLogic type to include rules
5. builderToForm.ts - TODO: Convert rules to runtime format
6. useFormEngine.ts - TODO: Evaluate condition-based rules during navigation

## Question types that need logic
- Contact: name, email, phone, cpf, cnpj, identity-doc, address
- Text: short-text, long-text, number, currency, link
- Choice: multiple-choice (DONE), dropdown (DONE), image-choice, yes-no (DONE), checkbox, multiple-select
- Rating: satisfaction, rating, nps, ranking, matrix
- Date: date
- Media: file-upload
- Special: legal
