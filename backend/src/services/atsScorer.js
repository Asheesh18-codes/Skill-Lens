// Simple ATS-style resume scoring utility

const ACTION_VERBS = [
  'led','managed','developed','built','designed','implemented','optimized','improved','launched',
  'created','architected','delivered','owned','migrated','automated','deployed','reduced','increased',
  'enhanced','streamlined','refactored','mentored','collaborated','analyzed','prototyped','tested'
];

const SECTION_REGEX = {
  contact: /(contact|email|phone|linkedin|github|portfolio)\b/i,
  summary: /(summary|objective|profile)\b/i,
  experience: /(experience|employment|work history|professional experience)\b/i,
  education: /(education|degree|bachelor|master|ph\.?d|university|college)\b/i,
  skills: /(skills|technical skills|technologies|tooling)\b/i,
  projects: /(projects|personal projects|selected projects)\b/i,
  certifications: /(certifications|certificates|licenses)\b/i
};

function countMatches(text, regex) {
  const m = text.match(regex);
  return m ? m.length : 0;
}

export function scoreResume(resumeText, analysis = {}, options = {}) {
  if (!resumeText || typeof resumeText !== 'string') {
    return { score: 0, breakdown: {}, suggestions: ['Resume text missing or invalid.'], version: '1.0' };
  }

  const text = resumeText;
  const lower = text.toLowerCase();
  const lines = text.split(/\r?\n/).filter(Boolean);

  // 1) Section coverage (0-35)
  let sectionPoints = 0;
  const sectionPresence = {};
  Object.entries(SECTION_REGEX).forEach(([key, rx]) => {
    const present = rx.test(text);
    sectionPresence[key] = present;
    if (present) sectionPoints += 5; // 7 sections -> max 35
  });
  if (sectionPoints > 35) sectionPoints = 35;

  // 2) Keyword relevancy from analysis (0-30)
  const skills = Array.isArray(analysis.skills) ? analysis.skills : [];
  const categories = analysis.categories || {};
  const confidences = analysis.confidence_scores || analysis.confidenceScores || {};
  const avgConfidence = skills.length
    ? skills.reduce((acc, s) => acc + (confidences[s] || 0), 0) / skills.length
    : 0;
  const catCount = Object.keys(categories).length;
  let keywordPoints = 0;
  // Heuristic: up to 18 pts for skills count, up to 12 pts for confidence & categories
  keywordPoints += Math.min(skills.length, 18); // 1 pt per skill, cap 18
  keywordPoints += Math.min(Math.round((avgConfidence / 1.0) * 6), 6); // avg conf 0-1 -> 0-6
  keywordPoints += Math.min(catCount, 6); // category diversity up to 6
  if (keywordPoints > 30) keywordPoints = 30;

  // 3) Formatting & readability (0-20)
  const bulletCount = countMatches(text, /(^|\n)\s*(\u2022|\-|\*)\s+/g);
  const longLines = lines.filter(l => l.length > 140).length;
  const avgLineLen = lines.length ? Math.round(lines.reduce((a, l) => a + l.length, 0) / lines.length) : 0;
  let formattingPoints = 0;
  if (bulletCount >= 8) formattingPoints += 8; else formattingPoints += Math.max(0, bulletCount);
  formattingPoints += avgLineLen > 50 && avgLineLen < 120 ? 6 : 3; // prefer concise lines
  formattingPoints += longLines <= Math.max(3, Math.round(lines.length * 0.05)) ? 6 : 2;
  if (formattingPoints > 20) formattingPoints = 20;

  // 4) Impact & action verbs (0-10)
  const actionVerbCount = ACTION_VERBS.reduce((acc, v) => acc + countMatches(lower, new RegExp(`\\b${v}\\b`, 'g')), 0);
  let impactPoints = 0;
  if (actionVerbCount >= 10) impactPoints = 10;
  else if (actionVerbCount >= 6) impactPoints = 8;
  else if (actionVerbCount >= 3) impactPoints = 6;
  else if (actionVerbCount >= 1) impactPoints = 4;

  // 5) Quantification (0-5)
  const numbers = countMatches(text, /\b\d+(%|k|m|\+)?\b/g);
  const quantPoints = Math.min(5, Math.round(numbers / 4));

  // 6) Contact completeness (0-5)
  const hasEmail = /[\w.+-]+@\w+\.[\w.-]+/i.test(text);
  const hasPhone = /\b(\+?\d[\d\s\-()]{7,})\b/.test(text);
  const hasLink = /(linkedin\.com|github\.com|portfolio|https?:\/\/)/i.test(text);
  const contactPoints = (hasEmail ? 2 : 0) + (hasPhone ? 2 : 0) + (hasLink ? 1 : 0);

  const total = sectionPoints + keywordPoints + formattingPoints + impactPoints + quantPoints + contactPoints;
  let score = Math.max(0, Math.min(100, total));

  // Suggestions
  const suggestions = [];
  Object.entries(sectionPresence).forEach(([k, present]) => {
    if (!present) suggestions.push(`Add a clear '${k}' section with a concise heading.`);
  });
  if (skills.length < 10) suggestions.push('Include more role-relevant keywords in the Skills section.');
  if (avgLineLen >= 120) suggestions.push('Break long paragraphs into concise bullet points.');
  if (bulletCount < 8) suggestions.push('Use more bullet points to highlight achievements.');
  if (actionVerbCount < 5) suggestions.push('Start bullets with strong action verbs (e.g., Led, Built, Optimized).');
  if (numbers < 5) suggestions.push('Quantify impact with numbers (%, $, time saved, scale).');
  if (!hasEmail || !hasPhone) suggestions.push('Ensure email and phone number are present and easy to find.');

  return {
    score,
    breakdown: {
      sections: sectionPoints,
      keywords: keywordPoints,
      formatting: formattingPoints,
      impact: impactPoints,
      quantification: quantPoints,
      contact: contactPoints
    },
    meta: {
      skillsCount: skills.length,
      categories: Object.keys(categories),
      avgConfidence
    },
    suggestions: suggestions.slice(0, 6),
    version: '1.0'
  };
}

export function generateResumeSummary(analysis = {}, ats = {}) {
  const skills = Array.isArray(analysis.skills) ? analysis.skills : [];
  const topSkills = skills.slice(0, 6);
  const categories = analysis.categories ? Object.keys(analysis.categories) : [];
  const catSnippet = categories.slice(0, 3).join(', ');
  const impactHint = (ats.breakdown && ats.breakdown.impact >= 6) ? 'proven impact' : 'impact';

  const parts = [];
  if (topSkills.length) {
    parts.push(`Hands-on with ${topSkills.slice(0, 3).join(', ')}${topSkills.length > 3 ? `, and ${topSkills[3]}` : ''}`);
  }
  if (catSnippet) {
    parts.push(`spanning ${catSnippet}`);
  }
  const line1 = parts.length ? parts.join(' ') + '.' : 'Results-driven professional with a strong technical foundation.';
  const line2 = `Focus on delivering ${impactHint} through clean execution, measurable results, and continuous improvement.`;
  const line3 = topSkills.length > 0 ? `Seeking roles where ${topSkills[0]} and adjacent skills create outsized value.` : '';
  const summary = [line1, line2, line3].filter(Boolean).join(' ');
  return summary.length > 320 ? summary.slice(0, 317) + '...' : summary;
}

export function summarizeImprovements(ats = {}) {
  const list = Array.isArray(ats.suggestions) ? ats.suggestions : [];
  const top = list.slice(0, 3);
  if (!top.length) return 'Resume is in good shape. Consider minor refinements for clarity and impact.';
  return top.join(' • ');
}

export default { scoreResume, generateResumeSummary, summarizeImprovements };
