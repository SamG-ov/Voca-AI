// true on phones and tablets, where there's no spacebar
export const isTouchScreen = window.matchMedia('(pointer: coarse)').matches
