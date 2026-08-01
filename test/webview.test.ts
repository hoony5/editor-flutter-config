import { describe, it, expect, beforeAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const mainJsPath = path.join(__dirname, '..', 'out', 'webview', 'main.js');

describe('webview main.js', () => {
  let js: string;

  beforeAll(() => {
    js = fs.readFileSync(mainJsPath, 'utf-8');
  });

  it('exists and is non-empty', () => {
    expect(js.length).toBeGreaterThan(1000);
  });

  it('has valid syntax', () => {
    expect(() => new Function(js)).not.toThrow();
  });

  it('defines core utility functions', () => {
    expect(js).toContain('function fmtB(');
    expect(js).toContain('function E(');
  });

  it('defines rendering functions for all tabs', () => {
    const fns = [
      'renderPlatform', 'renderEnv', 'renderCfg', 'renderTools',
      'renderManage', 'renderPubspec', 'renderLint', 'renderStatus',
      'renderRoutes', 'renderCodegen', 'renderAssetPreview',
    ];
    for (const fn of fns) {
      expect(js).toContain(`function ${fn}(`);
    }
  });

  it('defines state variables', () => {
    expect(js).toContain('var D=null');
    expect(js).toContain('permState=');
    expect(js).toContain('permUsage=');
  });

  it('defines permission catalog', () => {
    expect(js).toContain('PC=[');
    expect(js).toContain('PERM_META=');
  });

  it('defines icon constants', () => {
    expect(js).toContain('IC={');
    expect(js).toContain('eye:');
  });

  it('has message handler with try/catch isolation', () => {
    expect(js).toContain("addEventListener('message'");
    expect(js).toContain("catch(err){console.error('data:',err);}");
    expect(js).toContain("catch(err){console.error('platform:',err);}");
  });

  it('has tab click handler', () => {
    expect(js).toContain("querySelectorAll('.tab')");
    expect(js).toContain("V.postMessage({type:'readPubspec'})");
    expect(js).toContain("V.postMessage({type:'scanCodegen'})");
  });

  it('sends loadData on init', () => {
    expect(js).toContain("V.postMessage({type:\"loadData\"})");
  });

  it('has syntax highlighting helpers', () => {
    expect(js).toContain('function _jsonToHtml(');
    expect(js).toContain('function _csvToHtml(');
    expect(js).toContain('function _xmlToHtml(');
    expect(js).toContain('function _mdToHtml(');
  });

  it('has codegen rendering', () => {
    expect(js).toContain('function renderCodegen(');
    expect(js).toContain('function renderBuildYamlTree(');
  });
});
