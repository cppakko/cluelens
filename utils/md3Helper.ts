import { Hct, SchemeTonalSpot, MaterialDynamicColors, hexFromArgb } from "@material/material-color-utilities";

// Singleton: MaterialDynamicColors is stateless, create once and cache DynamicColor objects
const mdc = new MaterialDynamicColors();
const dynamicColors = [
    ['primary', mdc.primary()],
    ['on-primary', mdc.onPrimary()],
    ['primary-container', mdc.primaryContainer()],
    ['on-primary-container', mdc.onPrimaryContainer()],
    ['secondary', mdc.secondary()],
    ['on-secondary', mdc.onSecondary()],
    ['secondary-container', mdc.secondaryContainer()],
    ['on-secondary-container', mdc.onSecondaryContainer()],
    ['tertiary', mdc.tertiary()],
    ['on-tertiary', mdc.onTertiary()],
    ['tertiary-container', mdc.tertiaryContainer()],
    ['on-tertiary-container', mdc.onTertiaryContainer()],
    ['error', mdc.error()],
    ['on-error', mdc.onError()],
    ['error-container', mdc.errorContainer()],
    ['on-error-container', mdc.onErrorContainer()],
    ['surface', mdc.surface()],
    ['on-surface', mdc.onSurface()],
    ['on-surface-variant', mdc.onSurfaceVariant()],
    ['surface-container-lowest', mdc.surfaceContainerLowest()],
    ['surface-container-low', mdc.surfaceContainerLow()],
    ['surface-container', mdc.surfaceContainer()],
    ['surface-container-high', mdc.surfaceContainerHigh()],
    ['surface-container-highest', mdc.surfaceContainerHighest()],
    ['outline', mdc.outline()],
    ['outline-variant', mdc.outlineVariant()],
    ['inverse-surface', mdc.inverseSurface()],
    ['inverse-on-surface', mdc.inverseOnSurface()],
    ['inverse-primary', mdc.inversePrimary()],
] as const;


export function generateMD3Theme(
    seedColorHex: string,
    isDark: boolean = false,
    prefix: string = '--m3',
    chroma?: number,
    tone?: number,
): Record<string, string> {
    const baseHct = Hct.fromInt(parseInt(seedColorHex.replace('#', ''), 16) >>> 0 | 0xFF000000);
    const hct = Hct.from(
        baseHct.hue,
        chroma ?? baseHct.chroma,
        tone ?? baseHct.tone,
    );
    const scheme = new SchemeTonalSpot(hct, isDark, 0.5);

    const result: Record<string, string> = {};
    for (const [name, dc] of dynamicColors) {
        result[`${prefix}-${name}`] = hexFromArgb(dc.getArgb(scheme));
    }
    return result;
}

export function chromaGradient(hue: number, tone: number, steps = 12): string {
    const stops: string[] = [];
    const maxChroma = 150;
    for (let i = 0; i <= steps; i++) {
        const c = (i / steps) * maxChroma;
        stops.push(hexFromArgb(Hct.from(hue, c, tone).toInt()));
    }
    return `linear-gradient(to right, ${stops.join(', ')})`;
}

export function toneGradient(hue: number, chroma: number, steps = 12): string {
    const stops: string[] = [];
    for (let i = 0; i <= steps; i++) {
        const t = (i / steps) * 100;
        stops.push(hexFromArgb(Hct.from(hue, chroma, t).toInt()));
    }
    return `linear-gradient(to right, ${stops.join(', ')})`;
}

export function hueGradient(chroma: number, tone: number, steps = 24): string {
    const stops: string[] = [];
    for (let i = 0; i <= steps; i++) {
        const h = (i / steps) * 360;
        stops.push(hexFromArgb(Hct.from(h, chroma, tone).toInt()));
    }
    return `linear-gradient(to right, ${stops.join(', ')})`;
}