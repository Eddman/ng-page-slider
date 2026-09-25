[![CircleCI](https://circleci.com/gh/Eddman/ng-page-slider.svg?style=svg)](https://circleci.com/gh/Eddman/ng-page-slider)

**Fork of [KeatonTech/Angular-2-Page-Slider](https://github.com/KeatonTech/Angular-2-Page-Slider).**
---

**Mimicks the functionality of UIPageViewController in pure HTML for mobile web apps, using
native CSS scroll-snap for smooth, near-native performance. Fully standalone and signal-based,
zoneless-ready.**

*Designed for Angular 20.0.0+*

### Live Demo

https://samuel.netocny.com

# Example Usage

### Installation

```
npm install --save @netocny/ng-page-slider
```

### Typescript

```typescript
import {Component} from '@angular/core';
import {NgPageSliderComponent, NgPagesRendererDirective} from '@netocny/ng-page-slider';

@Component({
    selector: 'example-component',
    imports : [
        NgPageSliderComponent,
        NgPagesRendererDirective
    ],
    template: `
		<ng-page-slider
                [enableArrowKeys]="keysEnabled"
                [transitionDuration]="pages.duration"
                [autoScrollInterval]="pages.autoSlide">
            <!-- Pages -->
            <div *ngSliderPages="let page of pages.images"
                    class="page">
                <img [src]="page.imageURL" [alt]="page.title">
                <span class="title">{{page.title}}</span>
            </div>
        </ng-page-slider>
	`,
    styles  : [
        `.page {
            position: relative;
            overflow: hidden;
        }`,
        `img {
            height: 100%;
            width: auto;
            margin: auto;
            display: block;
        }`,
        `.title {
            font-size: 20px;
            color: white;
            position: absolute;
            bottom: 15px;
            left: 15px;
        }`
    ]
})
export class ExampleComponent {
    public keysEnabled = true;
    public pages = {
        duration : 700,
        autoSlide: 2000,
        images   : [
            {
                title   : 'Page 1',
                imageURL: 'some/image.png'
            },
            {
                title   : 'Page 2',
                imageURL: 'some/other_image.png'
            }
        ]
    };
}
```

### Styles - SCSS

And in `styles.scss` include:

```scss
@use "@netocny/ng-page-slider/ng-page-slider" as slider;

// Below this thershold the relative CSS units will be used and
// parts of the component became smaller (responsive design)
$minimal_page_width: 900px;
$page_margin: 15px;

@include slider.ng-page-slider($minimal_page_width, $page_margin);

// All options and defaults
@include slider.ng-page-slider(
        $optimal_width, $page_margin,
    $arrow_size: 44px,
    $arrow_line_height: 37px,
    $arrow_color: white, $arrow_background: rgba(125, 125, 125, 0.4),
    $dot_size: 6px, $dot_bottom_offset: 9px,
    $dot_color: white
)
```

# API

## NgPageSliderComponent (`ng-page-slider`)

Container component for pages. Handles touch events, resizing and animation.

### Input Properties

- **`page`:** Current page number, zero-based index.
    - Allows two-way data binding
    - Must be a `number` (`0 <= page < pageCount`)
    - Defaults to `0`
- **`transitionDuration`:** In the absence of scrolling momentum, how long should a transition take?
    - Expressed as an integer `number` of milliseconds `>= 0`
    - Defaults to 250ms
- **`locked`:** When true, page scrolling is disabled
    - `boolean`, defaults to `false`
- **`showIndicator`:** When `true`, includes a dot indicator at the bottom.
    - `boolean`, defaults to `true`
- **`overlayIndicator`:** When `true`, renders indicator above the page content.
    - `boolean`, defaults to `true`
- **`enableOverscroll`:** When `true`, user can scroll slightly past the first and last page.
    - `boolean`, defaults to `true`
- **`enableArrowKeys`:** When `true`, the left and right arrow keys will cause page navigation.
    - `boolean`, defaults to `true`
- **`autoScrollInterval`:** If provided the slider will auto-scroll until user interacts with it.
    - `number` of miliseconds before a next slide is shown
    - Must be a `number` - `> 0` (excluding)

## NgPagesRendererDirective (`ngSliderPages`)

Renders pages using DOM recycling, so only at most 3 exist on the DOM at any given time
(previous, current, next). Modeled based on `ngFor`, uses the exact same looping syntax.

### Provided Loop Variables

These variables are available inside of ngSliderPages, similar to ngFor loop items.

- **`index`:** `number` Zero-based index of the current page.
- **`isFirst`:** `boolean` True when the page is the first page.
- **`isLast`:** `boolean` True when the page is the last page.
- **`isActive`:** `boolean` True when the page is currently being viewed by the user.
