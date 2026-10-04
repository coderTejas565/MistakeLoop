import type { SubtopicStat } from './weakness';

/** Evidence strings come from templates, never from a model. */
export function evidenceFor(s: SubtopicStat): string {
  const shaky = s.shakyCorrect > 0 ? ` · +${s.shakyCorrect} correct but guessed or unsure` : '';
  switch (s.label) {
    case 'repeated':
      return `Missed in ${s.testsMissed} of ${s.testsSeen} tests · ${s.wrong} of ${s.attempts} questions wrong${shaky}`;
    case 'weak':
      return s.testsSeen === 1
        ? `${s.wrong} of ${s.attempts} wrong in your only test so far. First pass, not yet a pattern${shaky}`
        : `${s.wrong} of ${s.attempts} questions wrong across ${s.testsSeen} tests${shaky}`;
    case 'thin':
      return `Only ${s.attempts} question so far (${s.wrong} wrong). Not enough evidence yet${shaky}`;
    case 'watch':
      return s.wrong > 0
        ? `${s.wrong} of ${s.attempts} wrong, otherwise holding up${shaky}`
        : `All correct, but${shaky.replace(' · +', ' ')}`;
    default:
      return 'No recent mistakes';
  }
}
