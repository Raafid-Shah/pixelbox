// src/scenes/classic.ts
import { content } from '../content';
import { UI_PALETTE } from '../theme/tokens';

export class ClassicView {
  private container: HTMLElement | null = null;
  private profile = content.getProfile();
  private projects = content.getProjects();

  public mount(root: HTMLElement): void {
    this.container = root;
    root.innerHTML = '';
    root.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      min-height: 100vh;
      background: ${UI_PALETTE.nearBlack};
      color: ${UI_PALETTE.warmWhite};
      font-family: monospace, sans-serif;
      padding: 40px 20px;
      box-sizing: border-box;
      z-index: 99999;
      overflow-y: auto;
    `;

    root.innerHTML = `
      <div style="max-width: 800px; margin: 0 auto;">
        <header style="border-bottom: 2px solid ${UI_PALETTE.border}; padding-bottom: 20px; margin-bottom: 30px;">
          <h1 style="color: ${UI_PALETTE.amber}; font-size: 24px; margin-bottom: 8px;">${this.profile.name} // ${this.profile.title}</h1>
          <p style="color: ${UI_PALETTE.border}; font-size: 14px;">${this.profile.shortPitch}</p>
          <div style="margin-top: 16px;">
            <a href="?" style="color: ${UI_PALETTE.accentBlue}; text-decoration: underline; font-weight: bold;">[ RETURN TO 1989 ARCADE CAFE EXPERIENCE ]</a>
          </div>
        </header>

        <section style="margin-bottom: 40px;">
          <h2 style="color: ${UI_PALETTE.amber}; font-size: 18px; border-bottom: 1px dashed ${UI_PALETTE.borderShadow}; padding-bottom: 6px; margin-bottom: 16px;">01. BIO & ATTRIBUTES</h2>
          ${this.profile.bio.map((p) => `<p style="line-height: 1.6; margin-bottom: 12px;">${p}</p>`).join('')}
        </section>

        <section style="margin-bottom: 40px;">
          <h2 style="color: ${UI_PALETTE.amber}; font-size: 18px; border-bottom: 1px dashed ${UI_PALETTE.borderShadow}; padding-bottom: 6px; margin-bottom: 16px;">02. FEATURED PROJECTS</h2>
          <div style="display: grid; gap: 20px;">
            ${this.projects
              .map(
                (proj) => `
              <div style="border: 1px solid ${UI_PALETTE.borderShadow}; padding: 16px; background:${UI_PALETTE.panel}; border-radius: 4px;">
                <h3 style="color: ${UI_PALETTE.accentBlue}; margin-bottom: 6px;">${proj.title} (${proj.version})</h3>
                <p style="font-size: 13px; margin-bottom: 10px; color: #a0aec0;">${proj.summary}</p>
                <div style="font-size: 12px; color: ${UI_PALETTE.amber};">Tech: ${proj.tech.join(' / ')}</div>
              </div>
            `
              )
              .join('')}
          </div>
        </section>
      </div>
    `;
  }

  public unmount(): void {
    if (this.container) {
      this.container.innerHTML = '';
      this.container = null;
    }
  }
}

export const classicView = new ClassicView();