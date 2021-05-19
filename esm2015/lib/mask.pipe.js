import { Pipe } from '@angular/core';
import { MaskApplierService } from './mask-applier.service';
export class MaskPipe {
    constructor(_maskService) {
        this._maskService = _maskService;
    }
    transform(value, mask, thousandSeparator = null) {
        if (!value && typeof value !== 'number') {
            return '';
        }
        if (thousandSeparator) {
            this._maskService.thousandSeparator = thousandSeparator;
        }
        if (typeof mask === 'string') {
            return this._maskService.applyMask(`${value}`, mask);
        }
        return this._maskService.applyMaskWithPattern(`${value}`, mask);
    }
}
MaskPipe.decorators = [
    { type: Pipe, args: [{
                name: 'mask',
                pure: true,
            },] }
];
MaskPipe.ctorParameters = () => [
    { type: MaskApplierService }
];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFzay5waXBlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vcHJvamVjdHMvbmd4LW1hc2stbGliL3NyYy9saWIvbWFzay5waXBlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxJQUFJLEVBQWlCLE1BQU0sZUFBZSxDQUFDO0FBRXBELE9BQU8sRUFBRSxrQkFBa0IsRUFBRSxNQUFNLHdCQUF3QixDQUFDO0FBTzVELE1BQU0sT0FBTyxRQUFRO0lBQ25CLFlBQTJCLFlBQWdDO1FBQWhDLGlCQUFZLEdBQVosWUFBWSxDQUFvQjtJQUFHLENBQUM7SUFFeEQsU0FBUyxDQUNkLEtBQXNCLEVBQ3RCLElBQTRDLEVBQzVDLG9CQUFtQyxJQUFJO1FBRXZDLElBQUksQ0FBQyxLQUFLLElBQUksT0FBTyxLQUFLLEtBQUssUUFBUSxFQUFFO1lBQ3ZDLE9BQU8sRUFBRSxDQUFDO1NBQ1g7UUFDRCxJQUFJLGlCQUFpQixFQUFFO1lBQ3JCLElBQUksQ0FBQyxZQUFZLENBQUMsaUJBQWlCLEdBQUcsaUJBQWlCLENBQUM7U0FDekQ7UUFDRCxJQUFJLE9BQU8sSUFBSSxLQUFLLFFBQVEsRUFBRTtZQUM1QixPQUFPLElBQUksQ0FBQyxZQUFZLENBQUMsU0FBUyxDQUFDLEdBQUcsS0FBSyxFQUFFLEVBQUUsSUFBSSxDQUFDLENBQUM7U0FDdEQ7UUFDRCxPQUFPLElBQUksQ0FBQyxZQUFZLENBQUMsb0JBQW9CLENBQUMsR0FBRyxLQUFLLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQztJQUNsRSxDQUFDOzs7WUF0QkYsSUFBSSxTQUFDO2dCQUNKLElBQUksRUFBRSxNQUFNO2dCQUNaLElBQUksRUFBRSxJQUFJO2FBQ1g7OztZQU5RLGtCQUFrQiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFBpcGUsIFBpcGVUcmFuc2Zvcm0gfSBmcm9tICdAYW5ndWxhci9jb3JlJztcclxuXHJcbmltcG9ydCB7IE1hc2tBcHBsaWVyU2VydmljZSB9IGZyb20gJy4vbWFzay1hcHBsaWVyLnNlcnZpY2UnO1xyXG5pbXBvcnQgeyBJQ29uZmlnIH0gZnJvbSAnLi9jb25maWcnO1xyXG5cclxuQFBpcGUoe1xyXG4gIG5hbWU6ICdtYXNrJyxcclxuICBwdXJlOiB0cnVlLFxyXG59KVxyXG5leHBvcnQgY2xhc3MgTWFza1BpcGUgaW1wbGVtZW50cyBQaXBlVHJhbnNmb3JtIHtcclxuICBwdWJsaWMgY29uc3RydWN0b3IocHJpdmF0ZSBfbWFza1NlcnZpY2U6IE1hc2tBcHBsaWVyU2VydmljZSkge31cclxuXHJcbiAgcHVibGljIHRyYW5zZm9ybShcclxuICAgIHZhbHVlOiBzdHJpbmcgfCBudW1iZXIsXHJcbiAgICBtYXNrOiBzdHJpbmcgfCBbc3RyaW5nLCBJQ29uZmlnWydwYXR0ZXJucyddXSxcclxuICAgIHRob3VzYW5kU2VwYXJhdG9yOiBzdHJpbmcgfCBudWxsID0gbnVsbFxyXG4gICk6IHN0cmluZyB7XHJcbiAgICBpZiAoIXZhbHVlICYmIHR5cGVvZiB2YWx1ZSAhPT0gJ251bWJlcicpIHtcclxuICAgICAgcmV0dXJuICcnO1xyXG4gICAgfVxyXG4gICAgaWYgKHRob3VzYW5kU2VwYXJhdG9yKSB7XHJcbiAgICAgIHRoaXMuX21hc2tTZXJ2aWNlLnRob3VzYW5kU2VwYXJhdG9yID0gdGhvdXNhbmRTZXBhcmF0b3I7XHJcbiAgICB9XHJcbiAgICBpZiAodHlwZW9mIG1hc2sgPT09ICdzdHJpbmcnKSB7XHJcbiAgICAgIHJldHVybiB0aGlzLl9tYXNrU2VydmljZS5hcHBseU1hc2soYCR7dmFsdWV9YCwgbWFzayk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGhpcy5fbWFza1NlcnZpY2UuYXBwbHlNYXNrV2l0aFBhdHRlcm4oYCR7dmFsdWV9YCwgbWFzayk7XHJcbiAgfVxyXG59XHJcbiJdfQ==