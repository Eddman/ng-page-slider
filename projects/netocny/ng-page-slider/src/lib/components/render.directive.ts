import {Directive, effect, inject, input, TemplateRef, ViewContainerRef} from '@angular/core';

import {SliderPage} from '../types';

// Template context available inside *ngSliderPages, e.g. `let page` and `let i = index`.
export class NgSliderPageContext<T extends SliderPage> {
    public constructor(public readonly $implicit: T,
                       public readonly index: number,
                       public readonly count: number) {
    }

    public get isFirst(): boolean {
        return this.index === 0;
    }

    public get isLast(): boolean {
        return this.index === this.count - 1;
    }
}

// Renders every provided page once as a snap child; scrolling/snapping is handled natively.
@Directive({
    selector: '[ngSliderPages]'
})
export class NgPagesRendererDirective<T extends SliderPage> {

    private readonly viewContainer = inject(ViewContainerRef);
    private readonly template = inject<TemplateRef<NgSliderPageContext<T>>>(TemplateRef);

    // Alias is required so the `*ngSliderPages` microsyntax resolves (mirrors ngForOf).
    public readonly pages = input<T[], T[] | null | undefined>([], {
        // eslint-disable-next-line @angular-eslint/no-input-rename
        alias    : 'ngSliderPagesOf',
        transform: (value) => value ?? []
    });

    public constructor() {
        effect(() => {
            const pages = this.pages();
            this.viewContainer.clear();
            pages.forEach((page, index) => {
                this.viewContainer.createEmbeddedView(
                    this.template,
                    new NgSliderPageContext<T>(page, index, pages.length)
                );
            });
        });
    }

    public static ngTemplateContextGuard<T extends SliderPage>(
        _directive: NgPagesRendererDirective<T>,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        context: unknown
    ): context is NgSliderPageContext<T> {
        return true;
    }
}
