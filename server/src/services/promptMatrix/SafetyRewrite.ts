import { DEFAULT_CONCEPT, MAX_INPUT_LENGTH, MAX_WORDS } from '../../constants';
import type { SafetyRewriteResult } from './types';

const PII_TERMS = ['address', 'phone', 'email', 'ssn', 'passport'];
const MIN_USABLE_CHARS = 3;

const sanitizeWhitespace = (value: string) => value.replace(/\s+/g, ' ').trim();

export class SafetyRewrite {
  rewrite(input: string): SafetyRewriteResult {
    const flags: string[] = [];
    const usedGuardrails: string[] = [];
    let rewritten = sanitizeWhitespace(input);

    if (rewritten.length < MIN_USABLE_CHARS) {
      flags.push('empty');
      usedGuardrails.push('EMPTY_INPUT');
      return { rewrittenPrompt: DEFAULT_CONCEPT, flags, usedGuardrails };
    }

    for (const term of PII_TERMS) {
      if (rewritten.toLowerCase().includes(term)) {
        flags.push('pii');
        usedGuardrails.push('PII_REDACT');
        const regex = new RegExp(term, 'gi');
        rewritten = rewritten.replace(regex, 'redacted');
      }
    }

    rewritten = sanitizeWhitespace(rewritten);

    if (rewritten.length > MAX_INPUT_LENGTH) {
      rewritten = rewritten.slice(0, MAX_INPUT_LENGTH).trim();
      usedGuardrails.push('LENGTH_CLAMP');
    }

    const words = rewritten.split(/\s+/);
    if (words.length > MAX_WORDS) {
      rewritten = words.slice(0, MAX_WORDS).join(' ');
      usedGuardrails.push('WORDS_CLAMP');
    }

    if (!rewritten || rewritten.length < MIN_USABLE_CHARS) {
      flags.push('empty');
      usedGuardrails.push('EMPTY_AFTER_REWRITE');
      rewritten = DEFAULT_CONCEPT;
    }

    if (usedGuardrails.length === 0) {
      usedGuardrails.push('NO_GUARDRAIL');
    }

    return { rewrittenPrompt: rewritten, flags, usedGuardrails };
  }
}
