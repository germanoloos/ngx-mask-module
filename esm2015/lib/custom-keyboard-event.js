const commonjsGlobal = typeof globalThis !== 'undefined'
    ? globalThis
    : typeof window !== 'undefined'
        ? window
        : typeof global !== 'undefined'
            ? global
            : typeof self !== 'undefined'
                ? self
                : {};
(function () {
    if (!commonjsGlobal.KeyboardEvent) {
        commonjsGlobal.KeyboardEvent = function (_eventType, _init) { };
    }
})();
export {};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3VzdG9tLWtleWJvYXJkLWV2ZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vcHJvamVjdHMvbmd4LW1hc2stbGliL3NyYy9saWIvY3VzdG9tLWtleWJvYXJkLWV2ZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUdBLE1BQU0sY0FBYyxHQUNsQixPQUFPLFVBQVUsS0FBSyxXQUFXO0lBQy9CLENBQUMsQ0FBQyxVQUFVO0lBQ1osQ0FBQyxDQUFDLE9BQU8sTUFBTSxLQUFLLFdBQVc7UUFDL0IsQ0FBQyxDQUFDLE1BQU07UUFDUixDQUFDLENBQUMsT0FBTyxNQUFNLEtBQUssV0FBVztZQUMvQixDQUFDLENBQUMsTUFBTTtZQUNSLENBQUMsQ0FBQyxPQUFPLElBQUksS0FBSyxXQUFXO2dCQUM3QixDQUFDLENBQUMsSUFBSTtnQkFDTixDQUFDLENBQUMsRUFBRSxDQUFDO0FBRVQsQ0FBQztJQUNDLElBQUksQ0FBQyxjQUFjLENBQUMsYUFBYSxFQUFFO1FBQ2pDLGNBQWMsQ0FBQyxhQUFhLEdBQUcsVUFBVSxVQUFlLEVBQUUsS0FBVSxJQUFHLENBQUMsQ0FBQztLQUMxRTtBQUNILENBQUMsQ0FBQyxFQUFFLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyB0c2xpbnQ6ZGlzYWJsZTogbm8tYW55IHR5cGVkZWZcclxuZGVjbGFyZSB2YXIgZ2xvYmFsOiBhbnk7XHJcblxyXG5jb25zdCBjb21tb25qc0dsb2JhbCA9XHJcbiAgdHlwZW9mIGdsb2JhbFRoaXMgIT09ICd1bmRlZmluZWQnXHJcbiAgICA/IGdsb2JhbFRoaXNcclxuICAgIDogdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCdcclxuICAgID8gd2luZG93XHJcbiAgICA6IHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnXHJcbiAgICA/IGdsb2JhbFxyXG4gICAgOiB0eXBlb2Ygc2VsZiAhPT0gJ3VuZGVmaW5lZCdcclxuICAgID8gc2VsZlxyXG4gICAgOiB7fTtcclxuXHJcbihmdW5jdGlvbiAoKSB7XHJcbiAgaWYgKCFjb21tb25qc0dsb2JhbC5LZXlib2FyZEV2ZW50KSB7XHJcbiAgICBjb21tb25qc0dsb2JhbC5LZXlib2FyZEV2ZW50ID0gZnVuY3Rpb24gKF9ldmVudFR5cGU6IGFueSwgX2luaXQ6IGFueSkge307XHJcbiAgfVxyXG59KSgpO1xyXG5cclxuZXhwb3J0IHR5cGUgQ3VzdG9tS2V5Ym9hcmRFdmVudCA9IEtleWJvYXJkRXZlbnQ7XHJcbiJdfQ==