import {PRIVATE_USE_AREA_START} from '../constants';
import {IconFontGeneratorError} from '../errors';
import type {Icon} from '../types';

export function toLigature(name: string): string {
    return name.replace(/-/g, '_');
}

export function codepointAt(index: number): number {
    return PRIVATE_USE_AREA_START + index;
}

export function assertUniqueLigatures(icons: readonly Icon[]): void {
    const seen = new Map<string, Icon>();

    for (const icon of icons) {
        const previous = seen.get(icon.ligature);

        if (previous) {
            throw new IconFontGeneratorError(
                'DUPLICATE_LIGATURE',
                `Icons "${previous.name}" and "${icon.name}" both map to the ligature "${icon.ligature}".`,
                {hint: 'Hyphens are converted to underscores, so those two names collide. Rename one of the files.'},
            );
        }

        seen.set(icon.ligature, icon);
    }
}
