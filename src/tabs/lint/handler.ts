import { parseAnalysisOptions, toggleLintRule } from '../../shared/fileUtils';
import type { PostFn } from '../../types';

export function sendLintRules(root: string, post: PostFn): void {
  post({ type: 'lintRules', ...parseAnalysisOptions(root) });
}

export function doToggleLint(root: string, post: PostFn, rule: string, enabled: boolean): void {
  toggleLintRule(root, rule, enabled);
  sendLintRules(root, post);
}
