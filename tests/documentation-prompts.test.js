import { describe, expect, it } from 'vitest';
import { DOCUMENTATION_PROMPTS, appendDocumentationPrompt } from '../src/documentation-prompts.js';
import { newEncounter, buildSummary, updateEncounter, outputWarnings } from '../src/workspace-state.js';

const NOW = new Date('2026-10-01T12:00:00').getTime();

describe('optional editable documentation prompts', () => {
  it('provides four distinct documentation scaffolds with canonical targets and no management instructions', () => {
    expect(DOCUMENTATION_PROMPTS).toHaveLength(4);
    expect(new Set(DOCUMENTATION_PROMPTS.map(prompt => prompt.id)).size).toBe(4);
    expect(DOCUMENTATION_PROMPTS.map(prompt => prompt.target)).toEqual(['discussionDetails', 'discussionDetails', 'monitoring', 'handoff']);
    for (const prompt of DOCUMENTATION_PROMPTS) {
      expect(prompt.label).not.toBe('');
      expect(prompt.text).toContain('documentation prompts:');
      expect(prompt.text).toContain('[ ]');
      expect(prompt.text).not.toMatch(/\b\d+\b|mg|mmHg|q15|ICU|consent obtained|consent was|was administered|completed safety pause/i);
    }
  });

  it('preserves existing clinician text exactly and inserts an identical scaffold only once', () => {
    const existing = '  Entered clinician text.\nFollow-up remains pending.  ';
    const prompt = DOCUMENTATION_PROMPTS[0].text;
    const inserted = appendDocumentationPrompt(existing, prompt);
    expect(inserted.startsWith(existing)).toBe(true);
    expect(inserted).toBe(`${existing}\n\n${prompt}`);
    expect(appendDocumentationPrompt(inserted, prompt)).toBe(inserted);
    expect(appendDocumentationPrompt('', prompt)).toBe(prompt);
    expect(appendDocumentationPrompt(existing, '')).toBe(existing);
    expect(appendDocumentationPrompt(existing, ' \n ')).toBe(existing);
    expect(appendDocumentationPrompt(undefined, prompt)).toBe(prompt);
  });

  it('allows an additional distinct scaffold without replacing the earlier text or edits', () => {
    const first = appendDocumentationPrompt('', DOCUMENTATION_PROMPTS[0].text);
    const edited = first.replace('Participants: [ ]', 'Participants: clinician and surrogate');
    const added = appendDocumentationPrompt(edited, DOCUMENTATION_PROMPTS[1].text);
    expect(added.startsWith(edited)).toBe(true);
    expect(added).toContain(DOCUMENTATION_PROMPTS[1].text);
    expect(appendDocumentationPrompt(added, DOCUMENTATION_PROMPTS[1].text)).toBe(added);
  });

  it('does not populate a new encounter or assert discussion, consent or administration by selecting scaffold text', () => {
    const state = newEncounter(); state.note.diagnosisCategory = 'ischemic';
    expect(state.actions.discussionDetails).toBe('');
    expect(state.actions.discussion).toBe('');
    expect(state.actions.consent).toBe('');
    expect(state.actions.administered).toBe(false);
    expect(buildSummary(state, NOW)).not.toContain('documentation prompts:');
    const actions = { ...state.actions, discussionDetails: appendDocumentationPrompt(state.actions.discussionDetails, DOCUMENTATION_PROMPTS[0].text) };
    const inserted = updateEncounter(state, { actions });
    expect(inserted.actions.discussion).toBe('');
    expect(inserted.actions.consent).toBe('');
    expect(inserted.actions.administered).toBe(false);
    const text = buildSummary(inserted, NOW);
    expect(text).toContain('Discussion: not documented');
    expect(text).toContain('Consent status: not documented');
    expect(text).toContain('IVT administration: not documented');
    expect(text).toContain('Discussion details: IVT discussion documentation prompts:');
    expect(text).not.toContain('Informed consent obtained');
  });

  it('invalidates a generated draft after insertion or clearing and scans edited narrative details', () => {
    const state = newEncounter(); state.draft = { text: 'Prior generated document', stale: false };
    const inserted = updateEncounter(state, { actions: { ...state.actions, discussionDetails: DOCUMENTATION_PROMPTS[0].text } });
    expect(inserted.draft.stale).toBe(true);
    const cleared = updateEncounter({ ...inserted, draft: { ...inserted.draft, stale: false } }, { actions: { ...inserted.actions, discussionDetails: '' } });
    expect(cleared.draft.stale).toBe(true);
    const edited = { ...inserted, actions: { ...inserted.actions, discussionDetails: 'Participants: user@example.invalid' } };
    expect(outputWarnings(edited)).toContain('Possible email address');
  });
});
