import { registerBundledSkill } from '../../skills/bundledSkills.js'
import { SKILL_MD } from './strictCodeReviewPrompt.js'
import { REFERENCE_REPORT_HTML } from './referenceReportHtml.js'

export function registerStrictCodeReviewSkill(): void {
  registerBundledSkill({
    name: 'strict-codereview',
    description:
      'Run a strict, language-aware code review focused on maintainability, abstraction quality, architectural drift, large files, spaghetti branching, type boundaries, and actionable HTML reports. Use for strict code review, deep code quality audit, maintainability review, architecture review, PR review, or when the user asks for Chinese review output that preserves technical terms across coding-agent platforms, terminal workflows, and CI bots.',
    whenToUse:
      'When the user asks for a strict code review, deep code quality audit, maintainability review, architecture review, PR review, 严格代码审查, or Chinese review output that preserves technical terms.',
    userInvocable: true,
    context: 'fork',
    agent: 'general-purpose',
    files: {
      'reference_report.html': REFERENCE_REPORT_HTML,
    },
    async getPromptForCommand() {
      return [{ type: 'text', text: SKILL_MD }]
    },
  })
}
