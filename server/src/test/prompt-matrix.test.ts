import { describe, it, expect } from 'vitest';
import { SafetyRewrite } from '../services/promptMatrix/SafetyRewrite';
import { PromptMatrixEngine } from '../services/promptMatrix/PromptMatrixEngine';
import { PromptComposer } from '../services/promptMatrix/PromptComposer';
import { scoreMatrix } from '../services/promptMatrix/scoring';
import { MAX_INPUT_LENGTH } from '../constants';

describe('SafetyRewrite', () => {
  it('adds guardrail codes for pii', () => {
    const rewrite = new SafetyRewrite();
    const result = rewrite.rewrite('explicit content with phone number');
    expect(result.usedGuardrails).toContain('PII_REDACT');
  });

  it('adds NO_GUARDRAIL when no rewrite needed', () => {
    const rewrite = new SafetyRewrite();
    const result = rewrite.rewrite('neon doodle unicorn');
    expect(result.usedGuardrails).toEqual(['NO_GUARDRAIL']);
  });

  it('clamps long input and records length guardrail', () => {
    const rewrite = new SafetyRewrite();
    const longInput = 'a'.repeat(MAX_INPUT_LENGTH + 20);
    const result = rewrite.rewrite(longInput);
    expect(result.rewrittenPrompt.length).toBeLessThanOrEqual(MAX_INPUT_LENGTH);
    expect(result.usedGuardrails).toContain('LENGTH_CLAMP');
  });
});

describe('PromptMatrixEngine', () => {
  it('clamps energy by level', () => {
    const engine = new PromptMatrixEngine();
    const { energy, clamped } = engine.clampEnergy(2, 4);
    expect(energy).toBe(2);
    expect(clamped).toBe(true);
  });
});

describe('PromptComposer', () => {
  it('includes brand directives in prompt', () => {
    const composer = new PromptComposer();
    const promptPack = composer.compose({
      rewrittenPrompt: 'cosmic doodle',
      selection: {
        intent: 'hype',
        energy: 3,
        flavor: 'absurdist',
        pattern: 'B',
        context: ['candlesticks'],
        rewriteMode: 'strict',
      },
      baseId: 'base-01',
      preset: 'HORNY_CORE_SKETCH',
    });

    expect(promptPack.prompt).toContain('bold silhouette');
    expect(promptPack.prompt).toContain('high contrast');
    expect(promptPack.prompt).toContain('no text in image');
  });
});

describe('scoring', () => {
  it('returns scores in range', () => {
    const scores = scoreMatrix({
      selection: {
        intent: 'hype',
        energy: 3,
        flavor: 'absurdist',
        pattern: 'B',
        context: ['candlesticks'],
        rewriteMode: 'strict',
      },
      flags: [],
      rewrittenPrompt: 'neon doodle',
    });

    expect(scores.risk).toBeGreaterThanOrEqual(0);
    expect(scores.risk).toBeLessThanOrEqual(1);
    expect(scores.novelty).toBeGreaterThanOrEqual(0);
    expect(scores.novelty).toBeLessThanOrEqual(1);
    expect(scores.coherence).toBeGreaterThanOrEqual(0);
    expect(scores.coherence).toBeLessThanOrEqual(1);
  });
});
