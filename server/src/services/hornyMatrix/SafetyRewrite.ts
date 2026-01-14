import { DEFAULT_CONCEPT, FORBIDDEN_KEYWORDS, FORBIDDEN_PERSONS, MAX_INPUT_LENGTH, MAX_WORDS } from '../../constants';
import type { SafetyRewriteResult } from './types';

const EXPLICIT_TERMS = [
  'explicit',
  'nude',
  'nudity',
  'nsfw',
  'sex',
  'sexual',
  'porn',
  'genitals',
];

const PII_TERMS = ['address', 'phone', 'email', 'ssn', 'passport'];

const sanitizeWhitespace = (value: string) => value.replace(/\s+/g, ' ').trim();

export class SafetyRewrite {
  rewrite(input: string): SafetyRewriteResult {
    const flags: string[] = [];
    const usedGuardrails: string[] = [];
    let rewritten = sanitizeWhitespace(input);

    if (!rewritten) {
      usedGuardrails.push('EMPTY_INPUT_DEFAULT');
      return { rewrittenPrompt: DEFAULT_CONCEPT, flags, usedGuardrails };
    }

    for (const term of FORBIDDEN_KEYWORDS) {
      if (rewritten.toLowerCase().includes(term.toLowerCase())) {
        flags.push(`blocked:${term}`);
        usedGuardrails.push('STYLE_GUARDRAIL');
        if (EXPLICIT_TERMS.includes(term.toLowerCase())) {
          usedGuardrails.push('EXPLICIT_METAPHORIZE');
        }
        const regex = new RegExp(term, 'gi');
        rewritten = rewritten.replace(regex, '');
      }
    }

    for (const person of FORBIDDEN_PERSONS) {
      if (rewritten.toLowerCase().includes(person.toLowerCase())) {
        flags.push('person');
        usedGuardrails.push('PERSON_ABSTRACT');
        const regex = new RegExp(person, 'gi');
        rewritten = rewritten.replace(regex, 'symbolic figure');
      }
    }

    for (const term of EXPLICIT_TERMS) {
      if (rewritten.toLowerCase().includes(term)) {
        flags.push('explicit');
        usedGuardrails.push('EXPLICIT_METAPHORIZE');
        const regex = new RegExp(term, 'gi');
        rewritten = rewritten.replace(regex, 'metaphoric heat');
      }
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

    if (!rewritten || rewritten.length < 3) {
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
