/** The incomplete aphasia classifier and bedside procedural shortcuts are withheld. */
import React from 'react';

export const APHASIA_MAP = Object.freeze({});
export function classifyAphasia() {
  return {
    available: false,
    name: 'Classification unavailable',
    localization: null,
    desc: 'A complete language assessment, including naming and relevant confounders, is required. These inputs do not establish a syndrome or lesion location.'
  };
}

export function NeuroExamsTool() {
  return (
    <section className="rounded-lg border border-line bg-paper-2 p-4 text-ink-2" aria-labelledby="neuro-exam-reference-title">
      <h3 id="neuro-exam-reference-title" className="font-semibold">Bedside neurological examination reference</h3>
      <p>The automatic aphasia label, delirium comparison shortcuts, and abbreviated coma procedures are unavailable pending a complete source-based replacement.</p>
      <p className="mt-2">Document the observed findings and relevant language, hearing, vision, motor, arousal, and medication limitations. Missing or untestable findings are not normal findings. A new focal deficit or reduced consciousness requires urgent clinical assessment.</p>
      <p className="mt-2">For brain-death evaluation, use the complete applicable guideline and formal checklist with trained clinicians; a short bedside checklist cannot establish death by neurological criteria.</p>
      <a className="underline" href="https://pmc.ncbi.nlm.nih.gov/articles/PMC10791061/" target="_blank" rel="noopener noreferrer">AAN/AAP/CNS/SCCM 2023 consensus guideline</a>
    </section>
  );
}
export default NeuroExamsTool;
