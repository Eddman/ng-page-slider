import {
    ChangeDetectionStrategy,
    Component,
    HostAttributeToken,
    inject,
    input,
    output
} from '@angular/core';

@Component({
    selector           : 'ng-slider-nav-button',
    templateUrl        : 'navbutton.component.html',
    host               : {
        '[class.ng-slider-nav-button]': 'true'
    },
    changeDetection    : ChangeDetectionStrategy.OnPush,
    preserveWhitespaces: false
})
export class NgNavButtonComponent {

    private readonly isForward: boolean;

    public readonly disabled = input(false);
    public readonly navigate = output<void>();

    public constructor() {
        const forward = inject(new HostAttributeToken('forward'), {optional: true});
        const backward = inject(new HostAttributeToken('backward'), {optional: true});
        if (forward != null) {
            if (backward == null) {
                this.isForward = true;
            } else {
                throw new Error('Nav Button cannot be both forward and backwards');
            }
        } else if (backward != null) {
            this.isForward = false;
        } else {
            throw new Error('Must specify either \'forward\' or \'backward\' on nav button');
        }
    }

    public get symbol() {
        return this.isForward ? '&rsaquo;' : '&lsaquo;';
    }

    public handleClick() {
        if (this.disabled()) {
            return;
        }
        this.navigate.emit();
    }
}
