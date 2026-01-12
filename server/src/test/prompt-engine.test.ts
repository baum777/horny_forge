import { describe, expect, it } from 'vitest';
import { PromptEngine } from '../services/PromptEngine';

describe('PromptEngine', () => {
  it('T01: Baseline simple concept', () => {
    const result = PromptEngine.process({
      preset: 'HORNY_CORE_SKETCH',
      userInput: 'croisHorney bakery in space',
      baseId: 'base-01',
    });
    expect(['ok', 'sanitized']).toContain(result.safety?.status);
  });

  it('T02: German + pun concept', () => {
    const result = PromptEngine.process({
      preset: 'HORNY_CORE_SKETCH',
      userInput: 'eich-horney sammelt kerzen, neon chaos',
      baseId: 'base-01',
    });
    expect(['ok', 'sanitized']).toContain(result.safety?.status);
  });

  it('T03: Epic cathedral scene', () => {
    const result = PromptEngine.process({
      preset: 'HORNY_META_SCENE',
      userInput: 'holy cathedral glow, angelic hype beams, ironic',
      baseId: 'base-03',
    });
    expect(['ok', 'sanitized']).toContain(result.safety?.status);
  });

  it('T06: User tries to force photorealism', () => {
    const result = PromptEngine.process({
      preset: 'HORNY_META_SCENE',
      userInput: 'make it photorealistic and cinematic like a DSLR photo',
      baseId: 'base-01',
    });
    const promptLower = result.final_prompt.toLowerCase();
    const hasForbidden = ['photorealistic', 'cinematic', 'dslr'].some(term =>
      promptLower.includes(term)
    );
    expect(['sanitized', 'rejected']).toContain(result.safety?.status);
    expect(hasForbidden).toBe(false);
  });

  it('T06b: Photorealistic hint is normalized to illustrated', () => {
    const result = PromptEngine.process({
      preset: 'HORNY_META_SCENE',
      userInput: 'hyper-realistic photorealistic poster',
      baseId: 'base-01',
    });
    const promptLower = result.final_prompt.toLowerCase();
    expect(result.safety?.status).toBe('sanitized');
    expect(result.negative_terms).toHaveLength(0);
    expect(promptLower).toContain('illustrated');
    expect(promptLower).not.toContain('photorealistic');
    expect(promptLower).not.toContain('hyper-realistic');
  });

  it('T07: User tries to force 3D render style', () => {
    const result = PromptEngine.process({
      preset: 'HORNY_CORE_SKETCH',
      userInput: '3D octane render, ultra realistic, ray tracing',
      baseId: 'base-01',
    });
    const promptLower = result.final_prompt.toLowerCase();
    const hasForbidden = ['3d render', 'octane', 'ray tracing', 'ultra realistic'].some(term =>
      promptLower.includes(term)
    );
    expect(['sanitized', 'rejected']).toContain(result.safety?.status);
    expect(hasForbidden).toBe(false);
  });

  it('T09: Explicit attempt (must block/sanitize)', () => {
    const result = PromptEngine.process({
      preset: 'HORNY_CHAOS_VARIATION',
      userInput: 'make it NSFW nude horny',
      baseId: 'base-01',
    });
    const promptLower = result.final_prompt.toLowerCase();
    const hasForbidden = ['nsfw', 'nude'].some(term => promptLower.includes(term));
    expect(['rejected', 'sanitized']).toContain(result.safety?.status);
    expect(hasForbidden).toBe(false);
  });

  it('T10: Real person / celebrity attempt', () => {
    const result = PromptEngine.process({
      preset: 'HORNY_META_SCENE',
      userInput: 'put Elon Musk holding the unicorn',
      baseId: 'base-01',
    });
    const promptLower = result.final_prompt.toLowerCase();
    const hasForbidden = ['elon', 'musk'].some(term => promptLower.includes(term));
    expect(['sanitized', 'rejected']).toContain(result.safety?.status);
    expect(hasForbidden).toBe(false);
  });

  it('T11: Empty input (fallback concept)', () => {
    const result = PromptEngine.process({
      preset: 'HORNY_CORE_SKETCH',
      userInput: '   ',
      baseId: 'base-01',
    });
    expect(result.sanitized_input.length).toBeGreaterThan(0);
    expect(result.safety?.status).toBeDefined();
  });

  it('Schema validation: required fields', () => {
    const result = PromptEngine.process({
      preset: 'HORNY_CORE_SKETCH',
      userInput: 'test',
      baseId: 'base-01',
    });
    expect(result.version).toBe('1.0.0');
    expect(result.preset).toBeDefined();
    expect(result.base_id).toBeDefined();
    expect(result.sanitized_input.length).toBeGreaterThan(0);
    expect(result.concept_summary.length).toBeGreaterThanOrEqual(10);
    expect(result.final_prompt.length).toBeGreaterThanOrEqual(80);
    expect(Array.isArray(result.negative_terms)).toBe(true);
  });

  it('Prompt must contain brand DNA keywords', () => {
    const result = PromptEngine.process({
      preset: 'HORNY_CORE_SKETCH',
      userInput: 'test concept',
      baseId: 'base-01',
    });
    const promptLower = result.final_prompt.toLowerCase();
    const hasRequired = ['neon', 'yellow', 'sketch', 'black', 'rainbow horn'].every(term =>
      promptLower.includes(term)
    );
    expect(hasRequired).toBe(true);
  });

  it('Prompt must not contain forbidden style cues', () => {
    const result = PromptEngine.process({
      preset: 'HORNY_META_SCENE',
      userInput: 'normal scene',
      baseId: 'base-02',
    });
    const promptLower = result.final_prompt.toLowerCase();
    const hasForbidden = ['photorealistic', '3d render', 'oil painting'].some(term =>
      promptLower.includes(term)
    );
    expect(hasForbidden).toBe(false);
  });
});
