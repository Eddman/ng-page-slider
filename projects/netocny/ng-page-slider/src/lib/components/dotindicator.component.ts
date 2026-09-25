import {ChangeDetectionStrategy, Component, computed, input, output} from '@angular/core';

@Component({
    selector           : 'ng-dot-indicator',
    templateUrl        : 'dotindicator.component.html',
    host               : {
        '[class.ng-dot-indicator]': 'true'
    },
    changeDetection    : ChangeDetectionStrategy.OnPush,
    preserveWhitespaces: false
})
export class NDotIndicatorComponent {

    public readonly page = input<number>(0);
    public readonly pageCount = input<number>(0);

    public readonly dotClick = output<number>();

    public readonly items = computed<boolean[]>(() => {
        const count = this.pageCount() || 0;
        const selected = this.page();
        const result = new Array<boolean>(count);
        for (let i = 0; i < count; i++) {
            result[i] = i === selected;
        }
        return result;
    });
}
