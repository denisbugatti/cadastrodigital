# Save Error Investigation

## Key Finding
The network log shows `referentialEqualities` in the superjson metadata:
```
"meta":{"referentialEqualities":{"questions.3.conditionalLogic.branches":["questions.3.conditionalLogic.rules"]}}
```

This means superjson detected that `branches` and `rules` are the **same reference** (same array object).
This happens because in `createDefaultQuestion`, both `branches` and `rules` might share the same empty array reference.

The error "The string did not match the expected pattern" is a superjson deserialization error on the server side when it tries to resolve these referential equalities.

## Root Cause
In `createDefaultQuestion` or when loading forms from the database, `branches: []` and `rules: []` may be the same array reference. Superjson encodes this as a referential equality, and when the server tries to deserialize, it fails because the schema expects different types.

## Fix
Ensure `branches` and `rules` are always separate array instances in:
1. `createDefaultQuestion` in builderTypes.ts
2. When loading forms from the database (in the getFormById query)
3. In the oneInnovationForm.ts makeQ function
