import {
    ChangeDetectorRef,
    Directive,
    EmbeddedViewRef,
    EventEmitter,
    Input,
    OnDestroy,
    OnInit,
    Output,
    TemplateRef,
    ViewContainerRef
} from '@angular/core';

import {SliderPage, StackLocation} from '../types';

// PAGE CLASS ===============================================================================
// Stores information about each page that is accessible from the template

export class NgSliderPage<T extends SliderPage> {
    public constructor(public readonly $implicit: T,
                       public readonly index: number,
                       private readonly parent: NgPagesRendererDirective<T>) {
    }

    public get isActive() {
        return this.parent.page === this.index;
    }

    public get isFirst() {
        return this.index === 0;
    }

    public get isLast() {
        return this.index === this.parent.pageCount - 1;
    }
}

// PAGE RENDERER DIRECTIVE ==================================================================
// Similar to ngFor, but renders items as stacked full-screen pages

@Directive({
    selector: '[ngSliderPages]'
})
export class NgPagesRendererDirective<T extends SliderPage> implements OnInit, OnDestroy {

    // Page access
    private _page: number = 0;

    // Get the input data (using loop syntax)
    private _pages: T[] | undefined;

    @Output()
    public readonly pagesChange = new EventEmitter<T[]>();

    // Initialization
    private isInitialized: boolean = false;

    // Sizing
    private pageWidth: number = 0;
    private pageHeight: number = 0;

    // DOM views
    private views: Array<EmbeddedViewRef<any> | null> = [null, null, null];

    // Angular Injection
    public constructor(private readonly viewContainer: ViewContainerRef,
                       private readonly template: TemplateRef<NgSliderPage<T>>,
                       private readonly changeDetectorRef: ChangeDetectorRef) {
    }

    public ngOnInit() {
        this.isInitialized = true;
        this.createDOM();
    }

    public ngOnDestroy(): void {
        this.clearDOM();
    }

    @Input()
    public set ngSliderPagesOf(coll: T[]) {
        this._pages = coll;

        if (this.isInitialized) {
            this.clearDOM();
            this.createDOM();
        }

        this.pagesChange.emit(this.pages);
    }

    public get pages(): T[] {
        return this._pages || [];
    }

    public get pageCount() {
        return this.pages.length;
    }

    public get page(): number {
        return this._page;
    }

    public set page(page: number) {
        if (page < 0 || page >= this.pageCount) {
            return;
        }

        const oldPage = this._page;
        this._page = page;
        this.changePage(page, oldPage);
    }

    public resize(width: number, height: number) {
        this.pageWidth = width;
        this.pageHeight = height;

        this.restylePage(StackLocation.previous);
        this.restylePage(StackLocation.current);
        this.restylePage(StackLocation.next);
    }

    /**
     * Renders 3 pages.
     */
    private createDOM() {
        if (this.pageCount === 0 || this._pages == null) {
            return;
        }
        if (this.page > 0) {
            this.buildPage(this.page - 1, StackLocation.previous);
        }
        this.buildPage(this.page, StackLocation.current);
        if (this.page < this.pageCount - 1) {
            this.buildPage(this.page + 1, StackLocation.next);
        }
    }

    /**
     * Clears all pages out of the DOM, useful for re-rendering.
     */
    private clearDOM() {
        for (const view of this.views) {
            if (view) {
                view.destroy();
            }
        }
        this.views = [null, null, null];
    }

    private buildPage(pageNumber: number, loc: StackLocation) {
        if (pageNumber < 0 || pageNumber >= this.pageCount) {
            throw new Error('Attempted to create non-existent page: ' + pageNumber);
        }

        if (this._pages == null) {
            return;
        }

        // Create the page given the template
        this.views[loc] = this.viewContainer.createEmbeddedView(
            this.template,
            new NgSliderPage(this._pages[pageNumber], pageNumber, this));

        // Style the page accordingly
        this.restylePage(loc);

        this.changeDetectorRef.markForCheck();
    }

    private restylePage(loc: StackLocation) {
        if (this.views[loc] != null) {
            for (const rootNode of this.views[loc]!.rootNodes) {
                this.styleAsPage(rootNode);
                this.styleAtStackLocation(rootNode, loc);
            }
        }
    }

    /**
     * Styles a DOM element to be an absolute-positioned page-sized container.
     */
    private styleAsPage(pageElement: HTMLElement) {
        pageElement.style.display = 'block';
        pageElement.style.position = 'absolute';
        pageElement.style.width = this.pageWidth + 'px';
        pageElement.style.height = this.pageHeight + 'px';
    }

    // Styles a DOM element with an X location in the container
    private styleAtStackLocation(pageElement: HTMLElement, loc: StackLocation) {
        const xLocationInContainer = loc * this.pageWidth;
        pageElement.style.left = xLocationInContainer + 'px';
    }

    /**
     * Moves an existing page to a new stack location.
     */
    private changeStackLocationOfView(curr: StackLocation, to: StackLocation) {
        if (!this.views[curr]) {
            throw new Error('View does not exist at location: ' + curr);
        }
        for (const rootNode of this.views[curr]!.rootNodes) {
            this.styleAtStackLocation(rootNode, to);
        }
        this.views[to] = this.views[curr];
        this.views[curr] = null;
    }

    /**
     * Updates rendering to display a new page.
     */
    private changePage(newPage: number, oldPage: number) {
        // If the page is incrementing or decrementing, we can simply shift existing views
        if (newPage === oldPage + 1) {
            this.goToNextPage();
        } else if (newPage === oldPage - 1) {
            this.goToPreviousPage();
        } else {
            // Otherwise, just rebuild the DOM around this new page
            this.clearDOM();
            this.createDOM();
        }
    }

    private goToNextPage() {
        // Remove the previous page from the DOM
        if (this.views[StackLocation.previous]) {
            this.views[StackLocation.previous]!.destroy();
            this.views[StackLocation.previous] = null;
        }

        // Shift the Current and Next pages backwards
        this.changeStackLocationOfView(StackLocation.current, StackLocation.previous);
        this.changeStackLocationOfView(StackLocation.next, StackLocation.current);

        // Render a new page, if possible
        if (this.page < this.pageCount - 1) {
            this.buildPage(this.page + 1, StackLocation.next);
        }
    }

    private goToPreviousPage() {
        // Remove the previous page from the DOM
        if (this.views[StackLocation.next]) {
            this.views[StackLocation.next]!.destroy();
            this.views[StackLocation.next] = null;
        }

        // Shift the Current and Next pages backwards
        this.changeStackLocationOfView(StackLocation.current, StackLocation.next);
        this.changeStackLocationOfView(StackLocation.previous, StackLocation.current);

        // Render a new page, if possible
        if (this.page > 0) {
            this.buildPage(this.page - 1, StackLocation.previous);
        }
    }
}
