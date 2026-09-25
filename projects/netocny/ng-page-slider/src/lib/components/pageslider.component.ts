import {
    afterNextRender,
    ChangeDetectionStrategy,
    Component,
    computed,
    contentChild,
    DestroyRef,
    effect,
    ElementRef,
    inject,
    input,
    output,
    PLATFORM_ID,
    signal,
    viewChild
} from '@angular/core';
import {isPlatformBrowser} from '@angular/common';
import {NDotIndicatorComponent} from './dotindicator.component';
import {NgNavButtonComponent} from './navbutton.component';
import {NgPagesRendererDirective} from './render.directive';

@Component({
    selector           : 'ng-page-slider',
    templateUrl        : 'pageslider.component.html',
    host               : {
        '[class.ng-page-slider]': 'true'
    },
    changeDetection    : ChangeDetectionStrategy.OnPush,
    preserveWhitespaces: false,
    imports            : [
        NgNavButtonComponent,
        NDotIndicatorComponent
    ]
})
export class NgPageSliderComponent {

    private readonly destroyRef = inject(DestroyRef);
    private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

    public readonly showIndicator = input(true);
    public readonly transitionDuration = input(250);
    public readonly autoScrollInterval = input<number | undefined>(undefined);
    public readonly enableArrowKeys = input(false);

    public readonly pageChange = output<number>();

    private readonly track = viewChild.required<ElementRef<HTMLElement>>('track');
    private readonly renderer = contentChild(NgPagesRendererDirective);

    public readonly page = signal(0);
    public readonly pageCount = computed(() => this.renderer()?.pages().length ?? 0);

    private readonly interacted = signal(false);
    private scrollFrame = 0;
    private animating = false;

    // Viewport height derived from the first image so aspect ratio is preserved.
    public readonly sliderHeight = signal<number | null>(null);
    private firstImageWidth = 0;
    private firstImageHeight = 0;

    public constructor() {
        // Auto-scroll while untouched; restarts whenever inputs/page-count change.
        effect((onCleanup) => {
            const interval = this.autoScrollInterval();
            const count = this.pageCount();
            if (!this.isBrowser || this.interacted() || interval == null || interval <= 0 || count <= 1) {
                return;
            }
            const handle = setInterval(() => {
                const next = this.page() + 1 >= count ? 0 : this.page() + 1;
                this.goTo(next);
            }, interval + this.transitionDuration());
            onCleanup(() => clearInterval(handle));
        });

        // Measure the first image to size the viewport (no upscaling, keeps aspect ratio).
        effect(() => {
            const url = this.renderer()?.pages()[0]?.imageURL;
            if (!this.isBrowser || !url) {
                this.firstImageWidth = 0;
                this.firstImageHeight = 0;
                this.sliderHeight.set(null);
                return;
            }
            const probe = new Image();
            probe.onload = () => {
                this.firstImageWidth = probe.naturalWidth;
                this.firstImageHeight = probe.naturalHeight;
                this.applyHeight();
            };
            probe.src = url;
        });

        // Keep the current page aligned when the viewport is resized, and wire keyboard nav.
        // afterNextRender only runs in the browser, so DOM globals are safe here.
        afterNextRender(() => {
            const keyListener = (event: KeyboardEvent) => {
                if (!this.enableArrowKeys()) {
                    return;
                }
                if (event.key === 'ArrowLeft') {
                    this.previous();
                    this.emitHumanInteraction();
                } else if (event.key === 'ArrowRight') {
                    this.next();
                    this.emitHumanInteraction();
                }
            };
            document.addEventListener('keydown', keyListener);
            this.destroyRef.onDestroy(() => document.removeEventListener('keydown', keyListener));

            const element = this.track().nativeElement;
            const observer = new ResizeObserver(() => {
                this.applyHeight();
                element.scrollLeft = this.page() * element.clientWidth;
            });
            observer.observe(element);
            this.destroyRef.onDestroy(() => observer.disconnect());
        });
    }

    public onScroll(): void {
        if (this.scrollFrame || this.animating) {
            return;
        }
        this.scrollFrame = requestAnimationFrame(() => {
            this.scrollFrame = 0;
            const element = this.track().nativeElement;
            const index = Math.round(element.scrollLeft / element.clientWidth);
            if (index !== this.page()) {
                this.page.set(index);
                this.pageChange.emit(index);
            }
        });
    }

    public next(): void {
        this.goTo(this.page() + 1);
    }

    public previous(): void {
        this.goTo(this.page() - 1);
    }

    public goTo(index: number): void {
        const element = this.track().nativeElement;
        const clamped = Math.max(0, Math.min(index, this.pageCount() - 1));
        this.page.set(clamped);
        this.pageChange.emit(clamped);
        this.smoothScrollTo(element, clamped * element.clientWidth, this.transitionDuration());
    }

    // Disables auto-scroll on the first genuine user interaction.
    public emitHumanInteraction(): void {
        this.interacted.set(true);
    }

    // Sizes the viewport to the first image, scaling down only if it is wider than the track.
    private applyHeight(): void {
        if (this.firstImageWidth <= 0 || this.firstImageHeight <= 0) {
            return;
        }
        const width = this.track().nativeElement.clientWidth;
        const height = this.firstImageWidth > width
            ? Math.round((this.firstImageHeight * width) / this.firstImageWidth)
            : this.firstImageHeight;
        this.sliderHeight.set(height);
    }

    private smoothScrollTo(element: HTMLElement, target: number, duration: number): void {
        const from = element.scrollLeft;
        const distance = target - from;
        if (duration <= 0 || Math.abs(distance) < 1) {
            element.scrollLeft = target;
            return;
        }

        // Suspend snapping so intermediate frames are not snapped back mid-animation.
        this.animating = true;
        element.style.scrollSnapType = 'none';
        const start = performance.now();
        const ease = (t: number) => 0.5 - Math.cos(t * Math.PI) / 2;
        const step = (now: number) => {
            const t = Math.min(1, (now - start) / duration);
            element.scrollLeft = from + distance * ease(t);
            if (t < 1) {
                requestAnimationFrame(step);
            } else {
                element.style.scrollSnapType = '';
                this.animating = false;
            }
        };
        requestAnimationFrame(step);
    }
}
