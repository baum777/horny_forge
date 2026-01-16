# Horny Matrix Decision Trees

## SafetyRewrite
- If explicit terms → `EXPLICIT_METAPHORIZE`
- If PII → `PII_REDACT`
- If real person → `PERSON_ABSTRACT`
- If length exceeds limits → `LENGTH_CLAMP` / `WORDS_CLAMP`

## Energy Cap
- L1-2: cap 2
- L3-4: cap 3
- L5-6: cap 4
- L7+: cap 5

## Fallback
- Any selection failure → energy 1, pattern A, flavor `clean`, `fallback_used = true`
