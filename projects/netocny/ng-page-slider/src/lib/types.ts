/*
	This file contains some helpful types that are used throughout the module
*/

// The slider renders 3 pages to DOM at once, as follows
export enum StackLocation {
    previous,
    current,
    next
}

// Internal API for event handlers to control the page slider
export interface PageSliderControlAPI {
    scrollTo(x: number): void;

    animateToX(x: number, momentum: number): void;

    animateToNextPage(momentum: number): void;

    animateToPreviousPage(momentum: number): void;

    emitHumanInteraction(): void;

    readonly page: number;
    readonly pageCount: number;
    readonly transitionDuration: number;
    readonly pageWidth: number;
}

export interface Destroyable {
    destroy(): void;
}

export interface SliderPage {
    imageURL?: string;
}
