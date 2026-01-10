import { PromptEngine } from '../services/PromptEngine';
import type { PromptBuilderOutput } from '../types';

/**
 * Test suite for PromptEngine based on the spec test cases.
 */
function runTests() {
  console.log('🧪 Running PromptEngine tests...\n');

  let passed = 0;
  let failed = 0;

  function test(name: string, fn: () => boolean | { pass: boolean; message?: string }) {
    try {
      const result = fn();
      const pass = typeof result === 'boolean' ? result : result.pass;
      if (pass) {
        console.log(`✅ ${name}`);
        passed++;
      } else {
        const message = typeof result === 'object' ? result.message : '';
        console.log(`❌ ${name}${message ? `: ${message}` : ''}`);
        failed++;
      }
    } catch (error: any) {
      console.log(`❌ ${name}: ${error.message}`);
      failed++;
    }
  }

  // T01: Baseline simple concept
  test('T01: Baseline simple concept', () => {
    const result = PromptEngine.process({
      preset: 'HORNY_CORE_SKETCH',
      userInput: 'croisHorney bakery in space',
      baseId: 'base-01',
    });
    return result.safety?.status === 'ok' || result.safety?.status === 'sanitized';
  });

  // T02: German + pun concept
  test('T02: German + pun concept', () => {
    const result = PromptEngine.process({
      preset: 'HORNY_CORE_SKETCH',
      userInput: 'eich-horney sammelt kerzen, neon chaos',
      baseId: 'base-01',
    });
    return result.safety?.status === 'ok' || result.safety?.status === 'sanitized';
  });

  // T03: Epic cathedral scene
  test('T03: Epic cathedral scene', () => {
    const result = PromptEngine.process({
      preset: 'HORNY_META_SCENE',
      userInput: 'holy cathedral glow, angelic hype beams, ironic',
      baseId: 'base-03',
    });
    return result.safety?.status === 'ok' || result.safety?.status === 'sanitized';
  });

  // T06: User tries to force photorealism
  test('T06: User tries to force photorealism', () => {
    const result = PromptEngine.process({
      preset: 'HORNY_META_SCENE',
      userInput: 'make it photorealistic and cinematic like a DSLR photo',
      baseId: 'base-01',
    });
    const hasNegativeTerms = result.negative_terms.length > 0;
    const promptLower = result.final_prompt.toLowerCase();
    const hasForbidden = ['photorealistic', 'cinematic', 'dslr'].some(term => promptLower.includes(term));
    return result.safety?.status === 'sanitized' || result.safety?.status === 'rejected' && hasNegativeTerms && !hasForbidden;
  });

  // T07: User tries to force 3D render style
  test('T07: User tries to force 3D render style', () => {
    const result = PromptEngine.process({
      preset: 'HORNY_CORE_SKETCH',
      userInput: '3D octane render, ultra realistic, ray tracing',
      baseId: 'base-01',
    });
    const promptLower = result.final_prompt.toLowerCase();
    const hasForbidden = ['3d render', 'octane', 'ray tracing', 'ultra realistic'].some(term => promptLower.includes(term));
    return (result.safety?.status === 'sanitized' || result.safety?.status === 'rejected') && !hasForbidden;
  });

  // T09: Explicit attempt (must block/sanitize)
  test('T09: Explicit attempt (must block/sanitize)', () => {
    const result = PromptEngine.process({
      preset: 'HORNY_CHAOS_VARIATION',
      userInput: 'make it NSFW nude horny',
      baseId: 'base-01',
    });
    const promptLower = result.final_prompt.toLowerCase();
    const hasForbidden = ['nsfw', 'nude'].some(term => promptLower.includes(term));
    return (result.safety?.status === 'rejected' || result.safety?.status === 'sanitized') && !hasForbidden;
  });

  // T10: Real person / celebrity attempt
  test('T10: Real person / celebrity attempt', () => {
    const result = PromptEngine.process({
      preset: 'HORNY_META_SCENE',
      userInput: 'put Elon Musk holding the unicorn',
      baseId: 'base-01',
    });
    const promptLower = result.final_prompt.toLowerCase();
    const hasForbidden = ['elon', 'musk'].some(term => promptLower.includes(term));
    return (result.safety?.status === 'sanitized' || result.safety?.status === 'rejected') && !hasForbidden;
  });

  // T11: Empty input (fallback concept)
  test('T11: Empty input (fallback concept)', () => {
    const result = PromptEngine.process({
      preset: 'HORNY_CORE_SKETCH',
      userInput: '   ',
      baseId: 'base-01',
    });
    return result.sanitized_input.length > 0 && result.safety?.status !== undefined;
  });

  // Schema validation
  test('Schema validation: required fields', () => {
    const result = PromptEngine.process({
      preset: 'HORNY_CORE_SKETCH',
      userInput: 'test',
      baseId: 'base-01',
    });
    return (
      result.version === '1.0.0' &&
      result.preset !== undefined &&
      result.base_id !== undefined &&
      result.sanitized_input.length > 0 &&
      result.concept_summary.length >= 10 &&
      result.final_prompt.length >= 80 &&
      Array.isArray(result.negative_terms)
    );
  });

  // Prompt must contain brand DNA keywords
  test('Prompt must contain brand DNA keywords', () => {
    const result = PromptEngine.process({
      preset: 'HORNY_CORE_SKETCH',
      userInput: 'test concept',
      baseId: 'base-01',
    });
    const promptLower = result.final_prompt.toLowerCase();
    const hasRequired = ['neon', 'yellow', 'sketch', 'black', 'rainbow horn'].every(term => promptLower.includes(term));
    return hasRequired;
  });

  // Prompt must not contain forbidden style cues
  test('Prompt must not contain forbidden style cues', () => {
    const result = PromptEngine.process({
      preset: 'HORNY_META_SCENE',
      userInput: 'normal scene',
      baseId: 'base-02',
    });
    const promptLower = result.final_prompt.toLowerCase();
    const hasForbidden = ['photorealistic', '3d render', 'oil painting'].some(term => promptLower.includes(term));
    return !hasForbidden;
  });

  console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests();

