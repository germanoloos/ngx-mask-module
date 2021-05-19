import { NgModule } from '@angular/core';
import { config, INITIAL_CONFIG, initialConfig, NEW_CONFIG } from './config';
import { MaskApplierService } from './mask-applier.service';
import { MaskDirective } from './mask.directive';
import { MaskPipe } from './mask.pipe';
export class NgxMaskModule {
    static forRoot(configValue) {
        return {
            ngModule: NgxMaskModule,
            providers: [
                {
                    provide: NEW_CONFIG,
                    useValue: configValue,
                },
                {
                    provide: INITIAL_CONFIG,
                    useValue: initialConfig,
                },
                {
                    provide: config,
                    useFactory: _configFactory,
                    deps: [INITIAL_CONFIG, NEW_CONFIG],
                },
                MaskApplierService,
            ],
        };
    }
    static forChild() {
        return {
            ngModule: NgxMaskModule,
        };
    }
}
NgxMaskModule.decorators = [
    { type: NgModule, args: [{
                exports: [MaskDirective, MaskPipe],
                declarations: [MaskDirective, MaskPipe],
            },] }
];
/**
 * @internal
 */
export function _configFactory(initConfig, configValue) {
    return configValue instanceof Function ? Object.assign(Object.assign({}, initConfig), configValue()) : Object.assign(Object.assign({}, initConfig), configValue);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmd4LW1hc2subW9kdWxlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vcHJvamVjdHMvbmd4LW1hc2stbGliL3NyYy9saWIvbmd4LW1hc2subW9kdWxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBdUIsUUFBUSxFQUFFLE1BQU0sZUFBZSxDQUFDO0FBRTlELE9BQU8sRUFBRSxNQUFNLEVBQUUsY0FBYyxFQUFFLGFBQWEsRUFBRSxVQUFVLEVBQWlCLE1BQU0sVUFBVSxDQUFDO0FBQzVGLE9BQU8sRUFBRSxrQkFBa0IsRUFBRSxNQUFNLHdCQUF3QixDQUFDO0FBQzVELE9BQU8sRUFBRSxhQUFhLEVBQUUsTUFBTSxrQkFBa0IsQ0FBQztBQUNqRCxPQUFPLEVBQUUsUUFBUSxFQUFFLE1BQU0sYUFBYSxDQUFDO0FBTXZDLE1BQU0sT0FBTyxhQUFhO0lBQ2pCLE1BQU0sQ0FBQyxPQUFPLENBQUMsV0FBbUQ7UUFDdkUsT0FBTztZQUNMLFFBQVEsRUFBRSxhQUFhO1lBQ3ZCLFNBQVMsRUFBRTtnQkFDVDtvQkFDRSxPQUFPLEVBQUUsVUFBVTtvQkFDbkIsUUFBUSxFQUFFLFdBQVc7aUJBQ3RCO2dCQUNEO29CQUNFLE9BQU8sRUFBRSxjQUFjO29CQUN2QixRQUFRLEVBQUUsYUFBYTtpQkFDeEI7Z0JBQ0Q7b0JBQ0UsT0FBTyxFQUFFLE1BQU07b0JBQ2YsVUFBVSxFQUFFLGNBQWM7b0JBQzFCLElBQUksRUFBRSxDQUFDLGNBQWMsRUFBRSxVQUFVLENBQUM7aUJBQ25DO2dCQUNELGtCQUFrQjthQUNuQjtTQUNGLENBQUM7SUFDSixDQUFDO0lBQ00sTUFBTSxDQUFDLFFBQVE7UUFDcEIsT0FBTztZQUNMLFFBQVEsRUFBRSxhQUFhO1NBQ3hCLENBQUM7SUFDSixDQUFDOzs7WUE5QkYsUUFBUSxTQUFDO2dCQUNSLE9BQU8sRUFBRSxDQUFDLGFBQWEsRUFBRSxRQUFRLENBQUM7Z0JBQ2xDLFlBQVksRUFBRSxDQUFDLGFBQWEsRUFBRSxRQUFRLENBQUM7YUFDeEM7O0FBOEJEOztHQUVHO0FBQ0gsTUFBTSxVQUFVLGNBQWMsQ0FDNUIsVUFBeUIsRUFDekIsV0FBa0Q7SUFFbEQsT0FBTyxXQUFXLFlBQVksUUFBUSxDQUFDLENBQUMsaUNBQU0sVUFBVSxHQUFLLFdBQVcsRUFBRSxFQUFHLENBQUMsaUNBQU0sVUFBVSxHQUFLLFdBQVcsQ0FBRSxDQUFDO0FBQ25ILENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBNb2R1bGVXaXRoUHJvdmlkZXJzLCBOZ01vZHVsZSB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xyXG5cclxuaW1wb3J0IHsgY29uZmlnLCBJTklUSUFMX0NPTkZJRywgaW5pdGlhbENvbmZpZywgTkVXX0NPTkZJRywgb3B0aW9uc0NvbmZpZyB9IGZyb20gJy4vY29uZmlnJztcclxuaW1wb3J0IHsgTWFza0FwcGxpZXJTZXJ2aWNlIH0gZnJvbSAnLi9tYXNrLWFwcGxpZXIuc2VydmljZSc7XHJcbmltcG9ydCB7IE1hc2tEaXJlY3RpdmUgfSBmcm9tICcuL21hc2suZGlyZWN0aXZlJztcclxuaW1wb3J0IHsgTWFza1BpcGUgfSBmcm9tICcuL21hc2sucGlwZSc7XHJcblxyXG5ATmdNb2R1bGUoe1xyXG4gIGV4cG9ydHM6IFtNYXNrRGlyZWN0aXZlLCBNYXNrUGlwZV0sXHJcbiAgZGVjbGFyYXRpb25zOiBbTWFza0RpcmVjdGl2ZSwgTWFza1BpcGVdLFxyXG59KVxyXG5leHBvcnQgY2xhc3MgTmd4TWFza01vZHVsZSB7XHJcbiAgcHVibGljIHN0YXRpYyBmb3JSb290KGNvbmZpZ1ZhbHVlPzogb3B0aW9uc0NvbmZpZyB8ICgoKSA9PiBvcHRpb25zQ29uZmlnKSk6IE1vZHVsZVdpdGhQcm92aWRlcnM8Tmd4TWFza01vZHVsZT4ge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgbmdNb2R1bGU6IE5neE1hc2tNb2R1bGUsXHJcbiAgICAgIHByb3ZpZGVyczogW1xyXG4gICAgICAgIHtcclxuICAgICAgICAgIHByb3ZpZGU6IE5FV19DT05GSUcsXHJcbiAgICAgICAgICB1c2VWYWx1ZTogY29uZmlnVmFsdWUsXHJcbiAgICAgICAgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICBwcm92aWRlOiBJTklUSUFMX0NPTkZJRyxcclxuICAgICAgICAgIHVzZVZhbHVlOiBpbml0aWFsQ29uZmlnLFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgcHJvdmlkZTogY29uZmlnLFxyXG4gICAgICAgICAgdXNlRmFjdG9yeTogX2NvbmZpZ0ZhY3RvcnksXHJcbiAgICAgICAgICBkZXBzOiBbSU5JVElBTF9DT05GSUcsIE5FV19DT05GSUddLFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgTWFza0FwcGxpZXJTZXJ2aWNlLFxyXG4gICAgICBdLFxyXG4gICAgfTtcclxuICB9XHJcbiAgcHVibGljIHN0YXRpYyBmb3JDaGlsZCgpOiBNb2R1bGVXaXRoUHJvdmlkZXJzPE5neE1hc2tNb2R1bGU+IHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgIG5nTW9kdWxlOiBOZ3hNYXNrTW9kdWxlLFxyXG4gICAgfTtcclxuICB9XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBAaW50ZXJuYWxcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBfY29uZmlnRmFjdG9yeShcclxuICBpbml0Q29uZmlnOiBvcHRpb25zQ29uZmlnLFxyXG4gIGNvbmZpZ1ZhbHVlOiBvcHRpb25zQ29uZmlnIHwgKCgpID0+IG9wdGlvbnNDb25maWcpXHJcbik6IG9wdGlvbnNDb25maWcge1xyXG4gIHJldHVybiBjb25maWdWYWx1ZSBpbnN0YW5jZW9mIEZ1bmN0aW9uID8geyAuLi5pbml0Q29uZmlnLCAuLi5jb25maWdWYWx1ZSgpIH0gOiB7IC4uLmluaXRDb25maWcsIC4uLmNvbmZpZ1ZhbHVlIH07XHJcbn1cclxuIl19