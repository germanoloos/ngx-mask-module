import { ElementRef, Inject, Injectable, Renderer2 } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { config } from './config';
import { MaskApplierService } from './mask-applier.service';
export class MaskService extends MaskApplierService {
    constructor(document, _config, _elementRef, _renderer) {
        super(_config);
        this.document = document;
        this._config = _config;
        this._elementRef = _elementRef;
        this._renderer = _renderer;
        this.maskExpression = '';
        this.isNumberValue = false;
        this.placeHolderCharacter = '_';
        this.maskIsShown = '';
        this.selStart = null;
        this.selEnd = null;
        /**
         * Whether we are currently in writeValue function, in this case when applying the mask we don't want to trigger onChange function,
         * since writeValue should be a one way only process of writing the DOM value based on the Angular model value.
         */
        this.writingValue = false;
        this.onChange = (_) => { };
    }
    // tslint:disable-next-line:cyclomatic-complexity
    applyMask(inputValue, maskExpression, position = 0, justPasted = false, backspaced = false, cb = () => { }) {
        if (!maskExpression) {
            return inputValue;
        }
        this.maskIsShown = this.showMaskTyped ? this.showMaskInInput() : '';
        if (this.maskExpression === 'IP' && this.showMaskTyped) {
            this.maskIsShown = this.showMaskInInput(inputValue || '#');
        }
        if (this.maskExpression === 'CPF_CNPJ' && this.showMaskTyped) {
            this.maskIsShown = this.showMaskInInput(inputValue || '#');
        }
        if (!inputValue && this.showMaskTyped) {
            this.formControlResult(this.prefix);
            return this.prefix + this.maskIsShown;
        }
        const getSymbol = !!inputValue && typeof this.selStart === 'number' ? inputValue[this.selStart] : '';
        let newInputValue = '';
        if (this.hiddenInput && !this.writingValue) {
            let actualResult = this.actualValue.split('');
            // tslint:disable no-unused-expression
            inputValue !== '' && actualResult.length
                ? typeof this.selStart === 'number' && typeof this.selEnd === 'number'
                    ? inputValue.length > actualResult.length
                        ? actualResult.splice(this.selStart, 0, getSymbol)
                        : inputValue.length < actualResult.length
                            ? actualResult.length - inputValue.length === 1
                                ? actualResult.splice(this.selStart - 1, 1)
                                : actualResult.splice(this.selStart, this.selEnd - this.selStart)
                            : null
                    : null
                : (actualResult = []);
            // tslint:enable no-unused-expression
            newInputValue =
                this.actualValue.length && actualResult.length <= inputValue.length
                    ? this.shiftTypedSymbols(actualResult.join(''))
                    : inputValue;
        }
        newInputValue = Boolean(newInputValue) && newInputValue.length ? newInputValue : inputValue;
        const result = super.applyMask(newInputValue, maskExpression, position, justPasted, backspaced, cb);
        this.actualValue = this.getActualValue(result);
        // handle some separator implications:
        // a.) adjust decimalMarker default (. -> ,) if thousandSeparator is a dot
        if (this.thousandSeparator === '.' && this.decimalMarker === '.') {
            this.decimalMarker = ',';
        }
        // b) remove decimal marker from list of special characters to mask
        if (this.maskExpression.startsWith('separator') && this.dropSpecialCharacters === true) {
            this.maskSpecialCharacters = this.maskSpecialCharacters.filter((item) => item !== this.decimalMarker);
        }
        this.formControlResult(result);
        if (!this.showMaskTyped) {
            if (this.hiddenInput) {
                return result && result.length ? this.hideInput(result, this.maskExpression) : result;
            }
            return result;
        }
        const resLen = result.length;
        const prefNmask = this.prefix + this.maskIsShown;
        if (this.maskExpression.includes('H')) {
            const countSkipedSymbol = this._numberSkipedSymbols(result);
            return result + prefNmask.slice(resLen + countSkipedSymbol);
        }
        else if (this.maskExpression === 'IP' || this.maskExpression === 'CPF_CNPJ') {
            return result + prefNmask;
        }
        return result + prefNmask.slice(resLen);
    }
    // get the number of characters that were shifted
    _numberSkipedSymbols(value) {
        const regex = /(^|\D)(\d\D)/g;
        let match = regex.exec(value);
        let countSkipedSymbol = 0;
        while (match != null) {
            countSkipedSymbol += 1;
            match = regex.exec(value);
        }
        return countSkipedSymbol;
    }
    applyValueChanges(position = 0, justPasted, backspaced, cb = () => { }) {
        const formElement = this._elementRef.nativeElement;
        formElement.value = this.applyMask(formElement.value, this.maskExpression, position, justPasted, backspaced, cb);
        if (formElement === this.document.activeElement) {
            return;
        }
        this.clearIfNotMatchFn();
    }
    hideInput(inputValue, maskExpression) {
        return inputValue
            .split('')
            .map((curr, index) => {
            if (this.maskAvailablePatterns &&
                this.maskAvailablePatterns[maskExpression[index]] &&
                this.maskAvailablePatterns[maskExpression[index]].symbol) {
                return this.maskAvailablePatterns[maskExpression[index]].symbol;
            }
            return curr;
        })
            .join('');
    }
    // this function is not necessary, it checks result against maskExpression
    getActualValue(res) {
        const compare = res
            .split('')
            .filter((symbol, i) => this._checkSymbolMask(symbol, this.maskExpression[i]) ||
            (this.maskSpecialCharacters.includes(this.maskExpression[i]) && symbol === this.maskExpression[i]));
        if (compare.join('') === res) {
            return compare.join('');
        }
        return res;
    }
    shiftTypedSymbols(inputValue) {
        let symbolToReplace = '';
        const newInputValue = (inputValue &&
            inputValue.split('').map((currSymbol, index) => {
                if (this.maskSpecialCharacters.includes(inputValue[index + 1]) &&
                    inputValue[index + 1] !== this.maskExpression[index + 1]) {
                    symbolToReplace = currSymbol;
                    return inputValue[index + 1];
                }
                if (symbolToReplace.length) {
                    const replaceSymbol = symbolToReplace;
                    symbolToReplace = '';
                    return replaceSymbol;
                }
                return currSymbol;
            })) ||
            [];
        return newInputValue.join('');
    }
    showMaskInInput(inputVal) {
        if (this.showMaskTyped && !!this.shownMaskExpression) {
            if (this.maskExpression.length !== this.shownMaskExpression.length) {
                throw new Error('Mask expression must match mask placeholder length');
            }
            else {
                return this.shownMaskExpression;
            }
        }
        else if (this.showMaskTyped) {
            if (inputVal) {
                if (this.maskExpression === 'IP') {
                    return this._checkForIp(inputVal);
                }
                if (this.maskExpression === 'CPF_CNPJ') {
                    return this._checkForCpfCnpj(inputVal);
                }
            }
            return this.maskExpression.replace(/\w/g, this.placeHolderCharacter);
        }
        return '';
    }
    clearIfNotMatchFn() {
        const formElement = this._elementRef.nativeElement;
        if (this.clearIfNotMatch &&
            this.prefix.length + this.maskExpression.length + this.suffix.length !==
                formElement.value.replace(/_/g, '').length) {
            this.formElementProperty = ['value', ''];
            this.applyMask(formElement.value, this.maskExpression);
        }
    }
    set formElementProperty([name, value]) {
        Promise.resolve().then(() => this._renderer.setProperty(this._elementRef.nativeElement, name, value));
    }
    checkSpecialCharAmount(mask) {
        const chars = mask.split('').filter((item) => this._findSpecialChar(item));
        return chars.length;
    }
    removeMask(inputValue) {
        return this._removeMask(this._removeSuffix(this._removePrefix(inputValue)), this.maskSpecialCharacters.concat('_').concat(this.placeHolderCharacter));
    }
    _checkForIp(inputVal) {
        if (inputVal === '#') {
            return `${this.placeHolderCharacter}.${this.placeHolderCharacter}.${this.placeHolderCharacter}.${this.placeHolderCharacter}`;
        }
        const arr = [];
        for (let i = 0; i < inputVal.length; i++) {
            if (inputVal[i].match('\\d')) {
                arr.push(inputVal[i]);
            }
        }
        if (arr.length <= 3) {
            return `${this.placeHolderCharacter}.${this.placeHolderCharacter}.${this.placeHolderCharacter}`;
        }
        if (arr.length > 3 && arr.length <= 6) {
            return `${this.placeHolderCharacter}.${this.placeHolderCharacter}`;
        }
        if (arr.length > 6 && arr.length <= 9) {
            return this.placeHolderCharacter;
        }
        if (arr.length > 9 && arr.length <= 12) {
            return '';
        }
        return '';
    }
    _checkForCpfCnpj(inputVal) {
        const cpf = `${this.placeHolderCharacter}${this.placeHolderCharacter}${this.placeHolderCharacter}` +
            `.${this.placeHolderCharacter}${this.placeHolderCharacter}${this.placeHolderCharacter}` +
            `.${this.placeHolderCharacter}${this.placeHolderCharacter}${this.placeHolderCharacter}` +
            `-${this.placeHolderCharacter}${this.placeHolderCharacter}`;
        const cnpj = `${this.placeHolderCharacter}${this.placeHolderCharacter}` +
            `.${this.placeHolderCharacter}${this.placeHolderCharacter}${this.placeHolderCharacter}` +
            `.${this.placeHolderCharacter}${this.placeHolderCharacter}${this.placeHolderCharacter}` +
            `/${this.placeHolderCharacter}${this.placeHolderCharacter}${this.placeHolderCharacter}${this.placeHolderCharacter}` +
            `-${this.placeHolderCharacter}${this.placeHolderCharacter}`;
        if (inputVal === '#') {
            return cpf;
        }
        const arr = [];
        for (let i = 0; i < inputVal.length; i++) {
            if (inputVal[i].match('\\d')) {
                arr.push(inputVal[i]);
            }
        }
        if (arr.length <= 3) {
            return cpf.slice(arr.length, cpf.length);
        }
        if (arr.length > 3 && arr.length <= 6) {
            return cpf.slice(arr.length + 1, cpf.length);
        }
        if (arr.length > 6 && arr.length <= 9) {
            return cpf.slice(arr.length + 2, cpf.length);
        }
        if (arr.length > 9 && arr.length < 11) {
            return cpf.slice(arr.length + 3, cpf.length);
        }
        if (arr.length === 11) {
            return '';
        }
        if (arr.length === 12) {
            if (inputVal.length === 17) {
                return cnpj.slice(16, cnpj.length);
            }
            return cnpj.slice(15, cnpj.length);
        }
        if (arr.length > 12 && arr.length <= 14) {
            return cnpj.slice(arr.length + 4, cnpj.length);
        }
        return '';
    }
    /**
     * Propogates the input value back to the Angular model by triggering the onChange function. It won't do this if writingValue
     * is true. If that is true it means we are currently in the writeValue function, which is supposed to only update the actual
     * DOM element based on the Angular model value. It should be a one way process, i.e. writeValue should not be modifying the Angular
     * model value too. Therefore, we don't trigger onChange in this scenario.
     * @param inputValue the current form input value
     */
    formControlResult(inputValue) {
        if (this.writingValue) {
            return;
        }
        if (Array.isArray(this.dropSpecialCharacters)) {
            this.onChange(this._toNumber(this._removeMask(this._removeSuffix(this._removePrefix(inputValue)), this.dropSpecialCharacters)));
        }
        else if (this.dropSpecialCharacters) {
            this.onChange(this._toNumber(this._checkSymbols(inputValue)));
        }
        else {
            this.onChange(this._removeSuffix(inputValue));
        }
    }
    _toNumber(value) {
        if (!this.isNumberValue || value === '') {
            return value;
        }
        const num = Number(value);
        return Number.isNaN(num) ? value : num;
    }
    _removeMask(value, specialCharactersForRemove) {
        return value ? value.replace(this._regExpForRemove(specialCharactersForRemove), '') : value;
    }
    _removePrefix(value) {
        if (!this.prefix) {
            return value;
        }
        return value ? value.replace(this.prefix, '') : value;
    }
    _removeSuffix(value) {
        if (!this.suffix) {
            return value;
        }
        return value ? value.replace(this.suffix, '') : value;
    }
    _retrieveSeparatorValue(result) {
        return this._removeMask(this._removeSuffix(this._removePrefix(result)), this.maskSpecialCharacters);
    }
    _regExpForRemove(specialCharactersForRemove) {
        return new RegExp(specialCharactersForRemove.map((item) => `\\${item}`).join('|'), 'gi');
    }
    _checkSymbols(result) {
        if (result === '') {
            return result;
        }
        const separatorPrecision = this._retrieveSeparatorPrecision(this.maskExpression);
        let separatorValue = this._retrieveSeparatorValue(result);
        if (this.decimalMarker !== '.') {
            separatorValue = separatorValue.replace(this.decimalMarker, '.');
        }
        if (!this.isNumberValue) {
            return separatorValue;
        }
        if (separatorPrecision) {
            if (result === this.decimalMarker) {
                return null;
            }
            return this._checkPrecision(this.maskExpression, separatorValue);
        }
        else {
            return Number(separatorValue);
        }
    }
    // TODO should think about helpers or separting decimal precision to own property
    _retrieveSeparatorPrecision(maskExpretion) {
        const matcher = maskExpretion.match(new RegExp(`^separator\\.([^d]*)`));
        return matcher ? Number(matcher[1]) : null;
    }
    _checkPrecision(separatorExpression, separatorValue) {
        if (separatorExpression.indexOf('2') > 0) {
            return Number(separatorValue).toFixed(2);
        }
        return Number(separatorValue);
    }
}
MaskService.decorators = [
    { type: Injectable }
];
MaskService.ctorParameters = () => [
    { type: undefined, decorators: [{ type: Inject, args: [DOCUMENT,] }] },
    { type: undefined, decorators: [{ type: Inject, args: [config,] }] },
    { type: ElementRef },
    { type: Renderer2 }
];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFzay5zZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vcHJvamVjdHMvbmd4LW1hc2stbGliL3NyYy9saWIvbWFzay5zZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxVQUFVLEVBQUUsTUFBTSxFQUFFLFVBQVUsRUFBRSxTQUFTLEVBQUUsTUFBTSxlQUFlLENBQUM7QUFDMUUsT0FBTyxFQUFFLFFBQVEsRUFBRSxNQUFNLGlCQUFpQixDQUFDO0FBRTNDLE9BQU8sRUFBRSxNQUFNLEVBQVcsTUFBTSxVQUFVLENBQUM7QUFDM0MsT0FBTyxFQUFFLGtCQUFrQixFQUFFLE1BQU0sd0JBQXdCLENBQUM7QUFHNUQsTUFBTSxPQUFPLFdBQVksU0FBUSxrQkFBa0I7SUFnQmpELFlBQzRCLFFBQWEsRUFDYixPQUFnQixFQUNsQyxXQUF1QixFQUN2QixTQUFvQjtRQUU1QixLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7UUFMVyxhQUFRLEdBQVIsUUFBUSxDQUFLO1FBQ2IsWUFBTyxHQUFQLE9BQU8sQ0FBUztRQUNsQyxnQkFBVyxHQUFYLFdBQVcsQ0FBWTtRQUN2QixjQUFTLEdBQVQsU0FBUyxDQUFXO1FBbkJ2QixtQkFBYyxHQUFXLEVBQUUsQ0FBQztRQUM1QixrQkFBYSxHQUFZLEtBQUssQ0FBQztRQUMvQix5QkFBb0IsR0FBVyxHQUFHLENBQUM7UUFDbkMsZ0JBQVcsR0FBVyxFQUFFLENBQUM7UUFDekIsYUFBUSxHQUFrQixJQUFJLENBQUM7UUFDL0IsV0FBTSxHQUFrQixJQUFJLENBQUM7UUFFcEM7OztXQUdHO1FBQ0ksaUJBQVksR0FBWSxLQUFLLENBQUM7UUFFOUIsYUFBUSxHQUFHLENBQUMsQ0FBTSxFQUFFLEVBQUUsR0FBRSxDQUFDLENBQUM7SUFTakMsQ0FBQztJQUVELGlEQUFpRDtJQUMxQyxTQUFTLENBQ2QsVUFBa0IsRUFDbEIsY0FBc0IsRUFDdEIsV0FBbUIsQ0FBQyxFQUNw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S0FBSyxDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUUsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1NBQzFDO1FBQ0QsSUFBSSxHQUFHLENBQUMsTUFBTSxHQUFHLENBQUMsSUFBSSxHQUFHLENBQUMsTUFBTSxJQUFJLENBQUMsRUFBRTtZQUNyQyxPQUFPLEdBQUcsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1NBQzlDO1FBQ0QsSUFBSSxHQUFHLENBQUMsTUFBTSxHQUFHLENBQUMsSUFBSSxHQUFHLENBQUMsTUFBTSxJQUFJLENBQUMsRUFBRTtZQUNyQyxPQUFPLEdBQUcsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1NBQzlDO1FBQ0QsSUFBSSxHQUFHLENBQUMsTUFBTSxHQUFHLENBQUMsSUFBSSxHQUFHLENBQUMsTUFBTSxHQUFHLEVBQUUsRUFBRTtZQUNyQyxPQUFPLEdBQUcsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1NBQzlDO1FBQ0QsSUFBSSxHQUFHLENBQUMsTUFBTSxLQUFLLEVBQUUsRUFBRTtZQUNyQixPQUFPLEVBQUUsQ0FBQztTQUNYO1FBQ0QsSUFBSSxHQUFHLENBQUMsTUFBTSxLQUFLLEVBQUUsRUFBRTtZQUNyQixJQUFJLFFBQVEsQ0FBQyxNQUFNLEtBQUssRUFBRSxFQUFFO2dCQUMxQixPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQzthQUNwQztZQUNELE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1NBQ3BDO1FBQ0QsSUFBSSxHQUFHLENBQUMsTUFBTSxHQUFHLEVBQUUsSUFBSSxHQUFHLENBQUMsTUFBTSxJQUFJLEVB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QUN4QyxPQUFPLE1BQU0sQ0FBQyxjQUFjLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUM7U0FDMUM7UUFDRCxPQUFPLE1BQU0sQ0FBQyxjQUFjLENBQUMsQ0FBQztJQUNoQyxDQUFDOzs7WUFoWkYsVUFBVTs7OzRDQWtCTixNQUFNLFNBQUMsUUFBUTs0Q0FDZixNQUFNLFNBQUMsTUFBTTtZQXpCVCxVQUFVO1lBQXNCLFNBQVMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBFbGVtZW50UmVmLCBJbmplY3QsIEluamVjdGFibGUsIFJlbmRlcmVyMiB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xyXG5pbXBvcnQgeyBET0NVTUVOVCB9IGZyb20gJ0Bhbmd1bGFyL2NvbW1vbic7XHJcblxyXG5pbXBvcnQgeyBjb25maWcsIElDb25maWcgfSBmcm9tICcuL2NvbmZpZyc7XHJcbmltcG9ydCB7IE1hc2tBcHBsaWVyU2VydmljZSB9IGZyb20gJy4vbWFzay1hcHBsaWVyLnNlcnZpY2UnO1xyXG5cclxuQEluamVjdGFibGUoKVxyXG5leHBvcnQgY2xhc3MgTWFza1NlcnZpY2UgZXh0ZW5kcyBNYXNrQXBwbGllclNlcnZpY2Uge1xyXG4gIHB1YmxpYyBtYXNrRXhwcmVzc2lvbjogc3RyaW5nID0gJyc7XHJcbiAgcHVibGljIGlzTnVtYmVyVmFsdWU6IGJvb2xlYW4gPSBmYWxzZTtcclxuICBwdWJsaWMgcGxhY2VIb2xkZXJDaGFyYWN0ZXI6IHN0cmluZyA9ICdfJztcclxuICBwdWJsaWMgbWFza0lzU2hvd246IHN0cmluZyA9ICcnO1xyXG4gIHB1YmxpYyBzZWxTdGFydDogbnVtYmVyIHwgbnVsbCA9IG51bGw7XHJcbiAgcHVibGljIHNlbEVuZDogbnVtYmVyIHwgbnVsbCA9IG51bGw7XHJcblxyXG4gIC8qKlxyXG4gICAqIFdoZXRoZXIgd2UgYXJlIGN1cnJlbnRseSBpbiB3cml0ZVZhbHVlIGZ1bmN0aW9uLCBpbiB0aGlzIGNhc2Ugd2hlbiBhcHBseWluZyB0aGUgbWFzayB3ZSBkb24ndCB3YW50IHRvIHRyaWdnZXIgb25DaGFuZ2UgZnVuY3Rpb24sXHJcbiAgICogc2luY2Ugd3JpdGVWYWx1ZSBzaG91bGQgYmUgYSBvbmUgd2F5IG9ubHkgcHJvY2VzcyBvZiB3cml0aW5nIHRoZSBET00gdmFsdWUgYmFzZWQgb24gdGhlIEFuZ3VsYXIgbW9kZWwgdmFsdWUuXHJcbiAgICovXHJcbiAgcHVibGljIHdyaXRpbmdWYWx1ZTogYm9vbGVhbiA9IGZhbHNlO1xyXG5cclxuICBwdWJsaWMgb25DaGFuZ2UgPSAoXzogYW55KSA9PiB7fTtcclxuXHJcbiAgcHVibGljIGNvbnN0cnVjdG9yKFxyXG4gICAgQEluamVjdChET0NVTUVOVCkgcHJpdmF0ZSBkb2N1bWVudDogYW55LFxyXG4gICAgQEluamVjdChjb25maWcpIHByb3RlY3RlZCBfY29uZmlnOiBJQ29uZmlnLFxyXG4gICAgcHJpdmF0ZSBfZWxlbWVudFJlZjogRWxlbWVudFJlZixcclxuICAgIHByaXZhdGUgX3JlbmRlcmVyOiBSZW5kZXJlcjJcclxuICApIHtcclxuICAgIHN1cGVyKF9jb25maWcpO1xyXG4gIH1cclxuXHJcbiAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOmN5Y2xvbWF0aWMtY29tcGxleGl0eVxyXG4gIHB1YmxpYyBhcHBseU1hc2soXHJcbiAgICBpbnB1dFZhbHVlOiBzdHJpbmcsXHJcbiAgICBtYXNrRXhwcmVzc2lvbjogc3RyaW5nLFxyXG4gICAgcG9zaXRpb246IG51bWJlciA9IDAsXHJcbiAgICBqdXN0UGFzdGVkID0gZmFsc2UsXHJcbiAgICBiYWNrc3BhY2VkID0gZmFsc2UsXHJcbiAgICBjYjogRnVuY3Rpb24gPSAoKSA9PiB7fVxyXG4gICk6IHN0cmluZyB7XHJcbiAgICBpZiAoIW1hc2tFeHByZXNzaW9uKSB7XHJcbiAgICAgIHJldHVybiBpbnB1dFZhbHVlO1xyXG4gICAgfVxyXG4gICAgdGhpcy5tYXNrSXNTaG93biA9IHRoaXMuc2hvd01hc2tUeXBlZCA/IHRoaXMuc2hvd01hc2tJbklucHV0KCkgOiAnJztcclxuICAgIGlmICh0aGlzLm1hc2tFeHByZXNzaW9uID09PSAnSVAnICYmIHRoaXMuc2hvd01hc2tUeXBlZCkge1xyXG4gICAgICB0aGlzLm1hc2tJc1Nob3duID0gdGhpcy5zaG93TWFza0luSW5wdXQoaW5wdXRWYWx1ZSB8fCAnIycpO1xyXG4gICAgfVxyXG4gICAgaWYgKHRoaXMubWFza0V4cHJlc3Npb24gPT09ICdDUEZfQ05QSicgJiYgdGhpcy5zaG93TWFza1R5cGVkKSB7XHJcbiAgICAgIHRoaXMubWFza0lzU2hvd24gPSB0aGlzLnNob3dNYXNrSW5JbnB1dChpbnB1dFZhbHVlIHx8ICcjJyk7XHJcbiAgICB9XHJcbiAgICBpZiAoIWlucHV0VmFsdWUgJiYgdGhpcy5zaG93TWFza1R5cGVkKSB7XHJcbiAgICAgIHRoaXMuZm9ybUNvbnRyb2xSZXN1bHQodGhpcy5wcmVmaXgpO1xyXG4gICAgICByZXR1cm4gdGhpcy5wcmVmaXggKyB0aGlzLm1hc2tJc1Nob3duO1xyXG4gICAgfVxyXG4gICAgY29uc3QgZ2V0U3ltYm9sOiBzdHJpbmcgPSAhIWlucHV0VmFsdWUgJiYgdHlwZW9mIHRoaXMuc2VsU3RhcnQgPT09ICdudW1iZXInID8gaW5wdXRWYWx1ZVt0aGlzLnNlbFN0YXJ0XSA6ICcnO1xyXG4gICAgbGV0IG5ld0lucHV0VmFsdWUgPSAnJztcclxuICAgIGlmICh0aGlzLmhpZGRlbklucHV0ICYmICF0aGlzLndyaXRpbmdWYWx1ZSkge1xyXG4gICAgICBsZXQgYWN0dWFsUmVzdWx0OiBzdHJpbmdbXSA9IHRoaXMuYWN0dWFsVmFsdWUuc3BsaXQoJycpO1xyXG4gICAgICAvLyB0c2xpbnQ6ZGlzYWJsZSBuby11bnVzZWQtZXhwcmVzc2lvblxyXG4gICAgICBpbnB1dFZhbHVlICE9PSAnJyAmJiBhY3R1YWxSZXN1bHQubGVuZ3RoXHJcbiAgICAgICAgPyB0eXBlb2YgdGhpcy5zZWxTdGFydCA9PT0gJ251bWJlcicgJiYgdHlwZW9mIHRoaXMuc2VsRW5kID09PSAnbnVtYmVyJ1xyXG4gICAgICAgICAgPyBpbnB1dFZhbHVlLmxlbmd0aCA+IGFjdHVhbFJlc3VsdC5sZW5ndGhcclxuICAgICAgICAgICAgPyBhY3R1YWxSZXN1bHQuc3BsaWNlKHRoaXMuc2VsU3RhcnQsIDAsIGdldFN5bWJvbClcclxuICAgICAgICAgICAgOiBpbnB1dFZhbHVlLmxlbmd0aCA8IGFjdHVhbFJlc3VsdC5sZW5ndGhcclxuICAgICAgICAgICAgPyBhY3R1YWxSZXN1bHQubGVuZ3RoIC0gaW5wdXRWYWx1ZS5sZW5ndGggPT09IDFcclxuICAgICAgICAgICAgICA/IGFjdHVhbFJlc3VsdC5zcGxpY2UodGhpcy5zZWxTdGFydCAtIDEsIDEpXHJcbiAgICAgICAgICAgICAgOiBhY3R1YWxSZXN1bHQuc3BsaWNlKHRoaXMuc2VsU3RhcnQsIHRoaXMuc2VsRW5kIC0gdGhpcy5zZWxTdGFydClcclxuICAgICAgICAgICAgOiBudWxsXHJcbiAgICAgICAgICA6IG51bGxcclxuICAgICAgICA6IChhY3R1YWxSZXN1bHQgPSBbXSk7XHJcbiAgICAgIC8vIHRzbGludDplbmFibGUgbm8tdW51c2VkLWV4cHJlc3Npb25cclxuICAgICAgbmV3SW5wdXRWYWx1ZSA9XHJcbiAgICAgICAgdGhpcy5hY3R1YWxWYWx1ZS5sZW5ndGggJiYgYWN0dWFsUmVzdWx0Lmxlbmd0aCA8PSBpbnB1dFZhbHVlLmxlbmd0aFxyXG4gICAgICAgICAgPyB0aGlzLnNoaWZ0VHlwZWRTeW1ib2xzKGFjdHVhbFJlc3VsdC5qb2luKCcnKSlcclxuICAgICAgICAgIDogaW5wdXRWYWx1ZTtcclxuICAgIH1cclxuICAgIG5ld0lucHV0VmFsdWUgPSBCb29sZWFuKG5ld0lucHV0VmFsdWUpICYmIG5ld0lucHV0VmFsdWUubGVuZ3RoID8gbmV3SW5wdXRWYWx1ZSA6IGlucHV0VmFsdWU7XHJcbiAgICBjb25zdCByZXN1bHQ6IHN0cmluZyA9IHN1cGVyLmFwcGx5TWFzayhuZXdJbnB1dFZhbHVlLCBtYXNrRXhwcmVzc2lvbiwgcG9zaXRpb24sIGp1c3RQYXN0ZWQsIGJhY2tzcGFjZWQsIGNiKTtcclxuICAgIHRoaXMuYWN0dWFsVmFsdWUgPSB0aGlzLmdldEFjdHVhbFZhbHVlKHJlc3VsdCk7XHJcblxyXG4gICAgLy8gaGFuZGxlIHNvbWUgc2VwYXJhdG9yIGltcGxpY2F0aW9uczpcclxuICAgIC8vIGEuKSBhZGp1c3QgZGVjaW1hbE1hcmtlciBkZWZhdWx0ICguIC0+ICwpIGlmIHRob3VzYW5kU2VwYXJhdG9yIGlzIGEgZG90XHJcbiAgICBpZiAodGhpcy50aG91c2FuZFNlcGFyYXRvciA9PT0gJy4nICYmIHRoaXMuZGVjaW1hbE1hcmtlciA9PT0gJy4nKSB7XHJcbiAgICAgIHRoaXMuZGVjaW1hbE1hcmtlciA9ICcsJztcclxuICAgIH1cclxuXHJcbiAgICAvLyBiKSByZW1vdmUgZGVjaW1hbCBtYXJrZXIgZnJvbSBsaXN0IG9mIHNwZWNpYWwgY2hhcmFjdGVycyB0byBtYXNrXHJcbiAgICBpZiAodGhpcy5tYXNrRXhwcmVzc2lvbi5zdGFydHNXaXRoKCdzZXBhcmF0b3InKSAmJiB0aGlzLmRyb3BTcGVjaWFsQ2hhcmFjdGVycyA9PT0gdHJ1ZSkge1xyXG4gICAgICB0aGlzLm1hc2tTcGVjaWFsQ2hhcmFjdGVycyA9IHRoaXMubWFza1NwZWNpYWxDaGFyYWN0ZXJzLmZpbHRlcigoaXRlbTogc3RyaW5nKSA9PiBpdGVtICE9PSB0aGlzLmRlY2ltYWxNYXJrZXIpO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuZm9ybUNvbnRyb2xSZXN1bHQocmVzdWx0KTtcclxuXHJcbiAgICBpZiAoIXRoaXMuc2hvd01hc2tUeXBlZCkge1xyXG4gICAgICBpZiAodGhpcy5oaWRkZW5JbnB1dCkge1xyXG4gICAgICAgIHJldHVybiByZXN1bHQgJiYgcmVzdWx0Lmxlbmd0aCA/IHRoaXMuaGlkZUlucHV0KHJlc3VsdCwgdGhpcy5tYXNrRXhwcmVzc2lvbikgOiByZXN1bHQ7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH1cclxuICAgIGNvbnN0IHJlc0xlbjogbnVtYmVyID0gcmVzdWx0Lmxlbmd0aDtcclxuICAgIGNvbnN0IHByZWZObWFzazogc3RyaW5nID0gdGhpcy5wcmVmaXggKyB0aGlzLm1hc2tJc1Nob3duO1xyXG5cclxuICAgIGlmICh0aGlzLm1hc2tFeHByZXNzaW9uLmluY2x1ZGVzKCdIJykpIHtcclxuICAgICAgY29uc3QgY291bnRTa2lwZWRTeW1ib2wgPSB0aGlzLl9udW1iZXJTa2lwZWRTeW1ib2xzKHJlc3VsdCk7XHJcbiAgICAgIHJldHVybiByZXN1bHQgKyBwcmVmTm1hc2suc2xpY2UocmVzTGVuICsgY291bnRTa2lwZWRTeW1ib2wpO1xyXG4gICAgfSBlbHNlIGlmICh0aGlzLm1hc2tFeHByZXNzaW9uID09PSAnSVAnIHx8IHRoaXMubWFza0V4cHJlc3Npb24gPT09ICdDUEZfQ05QSicpIHtcclxuICAgICAgcmV0dXJuIHJlc3VsdCArIHByZWZObWFzaztcclxuICAgIH1cclxuICAgIHJldHVybiByZXN1bHQgKyBwcmVmTm1hc2suc2xpY2UocmVzTGVuKTtcclxuICB9XHJcblxyXG4gIC8vIGdldCB0aGUgbnVtYmVyIG9mIGNoYXJhY3RlcnMgdGhhdCB3ZXJlIHNoaWZ0ZWRcclxuICBwcml2YXRlIF9udW1iZXJTa2lwZWRTeW1ib2xzKHZhbHVlOiBzdHJpbmcpOiBudW1iZXIge1xyXG4gICAgY29uc3QgcmVnZXggPSAvKF58XFxEKShcXGRcXEQpL2c7XHJcbiAgICBsZXQgbWF0Y2ggPSByZWdleC5leGVjKHZhbHVlKTtcclxuICAgIGxldCBjb3VudFNraXBlZFN5bWJvbCA9IDA7XHJcbiAgICB3aGlsZSAobWF0Y2ggIT0gbnVsbCkge1xyXG4gICAgICBjb3VudFNraXBlZFN5bWJvbCArPSAxO1xyXG4gICAgICBtYXRjaCA9IHJlZ2V4LmV4ZWModmFsdWUpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGNvdW50U2tpcGVkU3ltYm9sO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGFwcGx5VmFsdWVDaGFuZ2VzKFxyXG4gICAgcG9zaXRpb246IG51bWJlciA9IDAsXHJcbiAgICBqdXN0UGFzdGVkOiBib29sZWFuLFxyXG4gICAgYmFja3NwYWNlZDogYm9vbGVhbixcclxuICAgIGNiOiBGdW5jdGlvbiA9ICgpID0+IHt9XHJcbiAgKTogdm9pZCB7XHJcbiAgICBjb25zdCBmb3JtRWxlbWVudCA9IHRoaXMuX2VsZW1lbnRSZWYubmF0aXZlRWxlbWVudDtcclxuICAgIGZvcm1FbGVtZW50LnZhbHVlID0gdGhpcy5hcHBseU1hc2soZm9ybUVsZW1lbnQudmFsdWUsIHRoaXMubWFza0V4cHJlc3Npb24sIHBvc2l0aW9uLCBqdXN0UGFzdGVkLCBiYWNrc3BhY2VkLCBjYik7XHJcbiAgICBpZiAoZm9ybUVsZW1lbnQgPT09IHRoaXMuZG9jdW1lbnQuYWN0aXZlRWxlbWVudCkge1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICB0aGlzLmNsZWFySWZOb3RNYXRjaEZuKCk7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgaGlkZUlucHV0KGlucHV0VmFsdWU6IHN0cmluZywgbWFza0V4cHJlc3Npb246IHN0cmluZyk6IHN0cmluZyB7XHJcbiAgICByZXR1cm4gaW5wdXRWYWx1ZVxyXG4gICAgICAuc3BsaXQoJycpXHJcbiAgICAgIC5tYXAoKGN1cnI6IHN0cmluZywgaW5kZXg6IG51bWJlcikgPT4ge1xyXG4gICAgICAgIGlmIChcclxuICAgICAgICAgIHRoaXMubWFza0F2YWlsYWJsZVBhdHRlcm5zICYmXHJcbiAgICAgICAgICB0aGlzLm1hc2tBdmFpbGFibGVQYXR0ZXJuc1ttYXNrRXhwcmVzc2lvbltpbmRleF1dICYmXHJcbiAgICAgICAgICB0aGlzLm1hc2tBdmFpbGFibGVQYXR0ZXJuc1ttYXNrRXhwcmVzc2lvbltpbmRleF1dLnN5bWJvbFxyXG4gICAgICAgICkge1xyXG4gICAgICAgICAgcmV0dXJuIHRoaXMubWFza0F2YWlsYWJsZVBhdHRlcm5zW21hc2tFeHByZXNzaW9uW2luZGV4XV0uc3ltYm9sO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gY3VycjtcclxuICAgICAgfSlcclxuICAgICAgLmpvaW4oJycpO1xyXG4gIH1cclxuXHJcbiAgLy8gdGhpcyBmdW5jdGlvbiBpcyBub3QgbmVjZXNzYXJ5LCBpdCBjaGVja3MgcmVzdWx0IGFnYWluc3QgbWFza0V4cHJlc3Npb25cclxuICBwdWJsaWMgZ2V0QWN0dWFsVmFsdWUocmVzOiBzdHJpbmcpOiBzdHJpbmcge1xyXG4gICAgY29uc3QgY29tcGFyZTogc3RyaW5nW10gPSByZXNcclxuICAgICAgLnNwbGl0KCcnKVxyXG4gICAgICAuZmlsdGVyKFxyXG4gICAgICAgIChzeW1ib2w6IHN0cmluZywgaTogbnVtYmVyKSA9PlxyXG4gICAgICAgICAgdGhpcy5fY2hlY2tTeW1ib2xNYXNrKHN5bWJvbCwgdGhpcy5tYXNrRXhwcmVzc2lvbltpXSkgfHxcclxuICAgICAgICAgICh0aGlzLm1hc2tTcGVjaWFsQ2hhcmFjdGVycy5pbmNsdWRlcyh0aGlzLm1hc2tFeHByZXNzaW9uW2ldKSAmJiBzeW1ib2wgPT09IHRoaXMubWFza0V4cHJlc3Npb25baV0pXHJcbiAgICAgICk7XHJcbiAgICBpZiAoY29tcGFyZS5qb2luKCcnKSA9PT0gcmVzKSB7XHJcbiAgICAgIHJldHVybiBjb21wYXJlLmpvaW4oJycpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHJlcztcclxuICB9XHJcblxyXG4gIHB1YmxpYyBzaGlmdFR5cGVkU3ltYm9scyhpbnB1dFZhbHVlOiBzdHJpbmcpOiBzdHJpbmcge1xyXG4gICAgbGV0IHN5bWJvbFRvUmVwbGFjZSA9ICcnO1xyXG4gICAgY29uc3QgbmV3SW5wdXRWYWx1ZTogc3RyaW5nW10gPVxyXG4gICAgICAoaW5wdXRWYWx1ZSAmJlxyXG4gICAgICAgIGlucHV0VmFsdWUuc3BsaXQoJycpLm1hcCgoY3VyclN5bWJvbDogc3RyaW5nLCBpbmRleDogbnVtYmVyKSA9PiB7XHJcbiAgICAgICAgICBpZiAoXHJcbiAgICAgICAgICAgIHRoaXMubWFza1NwZWNpYWxDaGFyYWN0ZXJzLmluY2x1ZGVzKGlucHV0VmFsdWVbaW5kZXggKyAxXSkgJiZcclxuICAgICAgICAgICAgaW5wdXRWYWx1ZVtpbmRleCArIDFdICE9PSB0aGlzLm1hc2tFeHByZXNzaW9uW2luZGV4ICsgMV1cclxuICAgICAgICAgICkge1xyXG4gICAgICAgICAgICBzeW1ib2xUb1JlcGxhY2UgPSBjdXJyU3ltYm9sO1xyXG4gICAgICAgICAgICByZXR1cm4gaW5wdXRWYWx1ZVtpbmRleCArIDFdO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgaWYgKHN5bWJvbFRvUmVwbGFjZS5sZW5ndGgpIHtcclxuICAgICAgICAgICAgY29uc3QgcmVwbGFjZVN5bWJvbDogc3RyaW5nID0gc3ltYm9sVG9SZXBsYWNlO1xyXG4gICAgICAgICAgICBzeW1ib2xUb1JlcGxhY2UgPSAnJztcclxuICAgICAgICAgICAgcmV0dXJuIHJlcGxhY2VTeW1ib2w7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICByZXR1cm4gY3VyclN5bWJvbDtcclxuICAgICAgICB9KSkgfHxcclxuICAgICAgW107XHJcbiAgICByZXR1cm4gbmV3SW5wdXRWYWx1ZS5qb2luKCcnKTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBzaG93TWFza0luSW5wdXQoaW5wdXRWYWw/OiBzdHJpbmcpOiBzdHJpbmcge1xyXG4gICAgaWYgKHRoaXMuc2hvd01hc2tUeXBlZCAmJiAhIXRoaXMuc2hvd25NYXNrRXhwcmVzc2lvbikge1xyXG4gICAgICBpZiAodGhpcy5tYXNrRXhwcmVzc2lvbi5sZW5ndGggIT09IHRoaXMuc2hvd25NYXNrRXhwcmVzc2lvbi5sZW5ndGgpIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ01hc2sgZXhwcmVzc2lvbiBtdXN0IG1hdGNoIG1hc2sgcGxhY2Vob2xkZXIgbGVuZ3RoJyk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuc2hvd25NYXNrRXhwcmVzc2lvbjtcclxuICAgICAgfVxyXG4gICAgfSBlbHNlIGlmICh0aGlzLnNob3dNYXNrVHlwZWQpIHtcclxuICAgICAgaWYgKGlucHV0VmFsKSB7XHJcbiAgICAgICAgaWYgKHRoaXMubWFza0V4cHJlc3Npb24gPT09ICdJUCcpIHtcclxuICAgICAgICAgIHJldHVybiB0aGlzLl9jaGVja0ZvcklwKGlucHV0VmFsKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHRoaXMubWFza0V4cHJlc3Npb24gPT09ICdDUEZfQ05QSicpIHtcclxuICAgICAgICAgIHJldHVybiB0aGlzLl9jaGVja0ZvckNwZkNucGooaW5wdXRWYWwpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gdGhpcy5tYXNrRXhwcmVzc2lvbi5yZXBsYWNlKC9cXHcvZywgdGhpcy5wbGFjZUhvbGRlckNoYXJhY3Rlcik7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gJyc7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgY2xlYXJJZk5vdE1hdGNoRm4oKTogdm9pZCB7XHJcbiAgICBjb25zdCBmb3JtRWxlbWVudCA9IHRoaXMuX2VsZW1lbnRSZWYubmF0aXZlRWxlbWVudDtcclxuICAgIGlmIChcclxuICAgICAgdGhpcy5jbGVhcklmTm90TWF0Y2ggJiZcclxuICAgICAgdGhpcy5wcmVmaXgubGVuZ3RoICsgdGhpcy5tYXNrRXhwcmVzc2lvbi5sZW5ndGggKyB0aGlzLnN1ZmZpeC5sZW5ndGggIT09XHJcbiAgICAgICAgZm9ybUVsZW1lbnQudmFsdWUucmVwbGFjZSgvXy9nLCAnJykubGVuZ3RoXHJcbiAgICApIHtcclxuICAgICAgdGhpcy5mb3JtRWxlbWVudFByb3BlcnR5ID0gWyd2YWx1ZScsICcnXTtcclxuICAgICAgdGhpcy5hcHBseU1hc2soZm9ybUVsZW1lbnQudmFsdWUsIHRoaXMubWFza0V4cHJlc3Npb24pO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcHVibGljIHNldCBmb3JtRWxlbWVudFByb3BlcnR5KFtuYW1lLCB2YWx1ZV06IFtzdHJpbmcsIHN0cmluZyB8IGJvb2xlYW5dKSB7XHJcbiAgICBQcm9taXNlLnJlc29sdmUoKS50aGVuKCgpID0+IHRoaXMuX3JlbmRlcmVyLnNldFByb3BlcnR5KHRoaXMuX2VsZW1lbnRSZWYubmF0aXZlRWxlbWVudCwgbmFtZSwgdmFsdWUpKTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBjaGVja1NwZWNpYWxDaGFyQW1vdW50KG1hc2s6IHN0cmluZyk6IG51bWJlciB7XHJcbiAgICBjb25zdCBjaGFyczogc3RyaW5nW10gPSBtYXNrLnNwbGl0KCcnKS5maWx0ZXIoKGl0ZW06IHN0cmluZykgPT4gdGhpcy5fZmluZFNwZWNpYWxDaGFyKGl0ZW0pKTtcclxuICAgIHJldHVybiBjaGFycy5sZW5ndGg7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgcmVtb3ZlTWFzayhpbnB1dFZhbHVlOiBzdHJpbmcpOiBzdHJpbmcge1xyXG4gICAgcmV0dXJuIHRoaXMuX3JlbW92ZU1hc2soXHJcbiAgICAgIHRoaXMuX3JlbW92ZVN1ZmZpeCh0aGlzLl9yZW1vdmVQcmVmaXgoaW5wdXRWYWx1ZSkpLFxyXG4gICAgICB0aGlzLm1hc2tTcGVjaWFsQ2hhcmFjdGVycy5jb25jYXQoJ18nKS5jb25jYXQodGhpcy5wbGFjZUhvbGRlckNoYXJhY3RlcilcclxuICAgICk7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIF9jaGVja0ZvcklwKGlucHV0VmFsOiBzdHJpbmcpOiBzdHJpbmcge1xyXG4gICAgaWYgKGlucHV0VmFsID09PSAnIycpIHtcclxuICAgICAgcmV0dXJuIGAke3RoaXMucGxhY2VIb2xkZXJDaGFyYWN0ZXJ9LiR7dGhpcy5wbGFjZUhvbGRlckNoYXJhY3Rlcn0uJHt0aGlzLnBsYWNlSG9sZGVyQ2hhcmFjdGVyfS4ke3RoaXMucGxhY2VIb2xkZXJDaGFyYWN0ZXJ9YDtcclxuICAgIH1cclxuICAgIGNvbnN0IGFycjogc3RyaW5nW10gPSBbXTtcclxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaW5wdXRWYWwubGVuZ3RoOyBpKyspIHtcclxuICAgICAgaWYgKGlucHV0VmFsW2ldLm1hdGNoKCdcXFxcZCcpKSB7XHJcbiAgICAgICAgYXJyLnB1c2goaW5wdXRWYWxbaV0pO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICBpZiAoYXJyLmxlbmd0aCA8PSAzKSB7XHJcbiAgICAgIHJldHVybiBgJHt0aGlzLnBsYWNlSG9sZGVyQ2hhcmFjdGVyfS4ke3RoaXMucGxhY2VIb2xkZXJDaGFyYWN0ZXJ9LiR7dGhpcy5wbGFjZUhvbGRlckNoYXJhY3Rlcn1gO1xyXG4gICAgfVxyXG4gICAgaWYgKGFyci5sZW5ndGggPiAzICYmIGFyci5sZW5ndGggPD0gNikge1xyXG4gICAgICByZXR1cm4gYCR7dGhpcy5wbGFjZUhvbGRlckNoYXJhY3Rlcn0uJHt0aGlzLnBsYWNlSG9sZGVyQ2hhcmFjdGVyfWA7XHJcbiAgICB9XHJcbiAgICBpZiAoYXJyLmxlbmd0aCA+IDYgJiYgYXJyLmxlbmd0aCA8PSA5KSB7XHJcbiAgICAgIHJldHVybiB0aGlzLnBsYWNlSG9sZGVyQ2hhcmFjdGVyO1xyXG4gICAgfVxyXG4gICAgaWYgKGFyci5sZW5ndGggPiA5ICYmIGFyci5sZW5ndGggPD0gMTIpIHtcclxuICAgICAgcmV0dXJuICcnO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuICcnO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBfY2hlY2tGb3JDcGZDbnBqKGlucHV0VmFsOiBzdHJpbmcpOiBzdHJpbmcge1xyXG4gICAgY29uc3QgY3BmID1cclxuICAgICAgYCR7dGhpcy5wbGFjZUhvbGRlckNoYXJhY3Rlcn0ke3RoaXMucGxhY2VIb2xkZXJDaGFyYWN0ZXJ9JHt0aGlzLnBsYWNlSG9sZGVyQ2hhcmFjdGVyfWAgK1xyXG4gICAgICBgLiR7dGhpcy5wbGFjZUhvbGRlckNoYXJhY3Rlcn0ke3RoaXMucGxhY2VIb2xkZXJDaGFyYWN0ZXJ9JHt0aGlzLnBsYWNlSG9sZGVyQ2hhcmFjdGVyfWAgK1xyXG4gICAgICBgLiR7dGhpcy5wbGFjZUhvbGRlckNoYXJhY3Rlcn0ke3RoaXMucGxhY2VIb2xkZXJDaGFyYWN0ZXJ9JHt0aGlzLnBsYWNlSG9sZGVyQ2hhcmFjdGVyfWAgK1xyXG4gICAgICBgLSR7dGhpcy5wbGFjZUhvbGRlckNoYXJhY3Rlcn0ke3RoaXMucGxhY2VIb2xkZXJDaGFyYWN0ZXJ9YDtcclxuICAgIGNvbnN0IGNucGogPVxyXG4gICAgICBgJHt0aGlzLnBsYWNlSG9sZGVyQ2hhcmFjdGVyfSR7dGhpcy5wbGFjZUhvbGRlckNoYXJhY3Rlcn1gICtcclxuICAgICAgYC4ke3RoaXMucGxhY2VIb2xkZXJDaGFyYWN0ZXJ9JHt0aGlzLnBsYWNlSG9sZGVyQ2hhcmFjdGVyfSR7dGhpcy5wbGFjZUhvbGRlckNoYXJhY3Rlcn1gICtcclxuICAgICAgYC4ke3RoaXMucGxhY2VIb2xkZXJDaGFyYWN0ZXJ9JHt0aGlzLnBsYWNlSG9sZGVyQ2hhcmFjdGVyfSR7dGhpcy5wbGFjZUhvbGRlckNoYXJhY3Rlcn1gICtcclxuICAgICAgYC8ke3RoaXMucGxhY2VIb2xkZXJDaGFyYWN0ZXJ9JHt0aGlzLnBsYWNlSG9sZGVyQ2hhcmFjdGVyfSR7dGhpcy5wbGFjZUhvbGRlckNoYXJhY3Rlcn0ke3RoaXMucGxhY2VIb2xkZXJDaGFyYWN0ZXJ9YCArXHJcbiAgICAgIGAtJHt0aGlzLnBsYWNlSG9sZGVyQ2hhcmFjdGVyfSR7dGhpcy5wbGFjZUhvbGRlckNoYXJhY3Rlcn1gO1xyXG5cclxuICAgIGlmIChpbnB1dFZhbCA9PT0gJyMnKSB7XHJcbiAgICAgIHJldHVybiBjcGY7XHJcbiAgICB9XHJcbiAgICBjb25zdCBhcnI6IHN0cmluZ1tdID0gW107XHJcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGlucHV0VmFsLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgIGlmIChpbnB1dFZhbFtpXS5tYXRjaCgnXFxcXGQnKSkge1xyXG4gICAgICAgIGFyci5wdXNoKGlucHV0VmFsW2ldKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgaWYgKGFyci5sZW5ndGggPD0gMykge1xyXG4gICAgICByZXR1cm4gY3BmLnNsaWNlKGFyci5sZW5ndGgsIGNwZi5sZW5ndGgpO1xyXG4gICAgfVxyXG4gICAgaWYgKGFyci5sZW5ndGggPiAzICYmIGFyci5sZW5ndGggPD0gNikge1xyXG4gICAgICByZXR1cm4gY3BmLnNsaWNlKGFyci5sZW5ndGggKyAxLCBjcGYubGVuZ3RoKTtcclxuICAgIH1cclxuICAgIGlmIChhcnIubGVuZ3RoID4gNiAmJiBhcnIubGVuZ3RoIDw9IDkpIHtcclxuICAgICAgcmV0dXJuIGNwZi5zbGljZShhcnIubGVuZ3RoICsgMiwgY3BmLmxlbmd0aCk7XHJcbiAgICB9XHJcbiAgICBpZiAoYXJyLmxlbmd0aCA+IDkgJiYgYXJyLmxlbmd0aCA8IDExKSB7XHJcbiAgICAgIHJldHVybiBjcGYuc2xpY2UoYXJyLmxlbmd0aCArIDMsIGNwZi5sZW5ndGgpO1xyXG4gICAgfVxyXG4gICAgaWYgKGFyci5sZW5ndGggPT09IDExKSB7XHJcbiAgICAgIHJldHVybiAnJztcclxuICAgIH1cclxuICAgIGlmIChhcnIubGVuZ3RoID09PSAxMikge1xyXG4gICAgICBpZiAoaW5wdXRWYWwubGVuZ3RoID09PSAxNykge1xyXG4gICAgICAgIHJldHVybiBjbnBqLnNsaWNlKDE2LCBjbnBqLmxlbmd0aCk7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIGNucGouc2xpY2UoMTUsIGNucGoubGVuZ3RoKTtcclxuICAgIH1cclxuICAgIGlmIChhcnIubGVuZ3RoID4gMTIgJiYgYXJyLmxlbmd0aCA8PSAxNCkge1xyXG4gICAgICByZXR1cm4gY25wai5zbGljZShhcnIubGVuZ3RoICsgNCwgY25wai5sZW5ndGgpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuICcnO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUHJvcG9nYXRlcyB0aGUgaW5wdXQgdmFsdWUgYmFjayB0byB0aGUgQW5ndWxhciBtb2RlbCBieSB0cmlnZ2VyaW5nIHRoZSBvbkNoYW5nZSBmdW5jdGlvbi4gSXQgd29uJ3QgZG8gdGhpcyBpZiB3cml0aW5nVmFsdWVcclxuICAgKiBpcyB0cnVlLiBJZiB0aGF0IGlzIHRydWUgaXQgbWVhbnMgd2UgYXJlIGN1cnJlbnRseSBpbiB0aGUgd3JpdGVWYWx1ZSBmdW5jdGlvbiwgd2hpY2ggaXMgc3VwcG9zZWQgdG8gb25seSB1cGRhdGUgdGhlIGFjdHVhbFxyXG4gICAqIERPTSBlbGVtZW50IGJhc2VkIG9uIHRoZSBBbmd1bGFyIG1vZGVsIHZhbHVlLiBJdCBzaG91bGQgYmUgYSBvbmUgd2F5IHByb2Nlc3MsIGkuZS4gd3JpdGVWYWx1ZSBzaG91bGQgbm90IGJlIG1vZGlmeWluZyB0aGUgQW5ndWxhclxyXG4gICAqIG1vZGVsIHZhbHVlIHRvby4gVGhlcmVmb3JlLCB3ZSBkb24ndCB0cmlnZ2VyIG9uQ2hhbmdlIGluIHRoaXMgc2NlbmFyaW8uXHJcbiAgICogQHBhcmFtIGlucHV0VmFsdWUgdGhlIGN1cnJlbnQgZm9ybSBpbnB1dCB2YWx1ZVxyXG4gICAqL1xyXG4gIHByaXZhdGUgZm9ybUNvbnRyb2xSZXN1bHQoaW5wdXRWYWx1ZTogc3RyaW5nKTogdm9pZCB7XHJcbiAgICBpZiAodGhpcy53cml0aW5nVmFsdWUpIHtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgaWYgKEFycmF5LmlzQXJyYXkodGhpcy5kcm9wU3BlY2lhbENoYXJhY3RlcnMpKSB7XHJcbiAgICAgIHRoaXMub25DaGFuZ2UoXHJcbiAgICAgICAgdGhpcy5fdG9OdW1iZXIodGhpcy5fcmVtb3ZlTWFzayh0aGlzLl9yZW1vdmVTdWZmaXgodGhpcy5fcmVtb3ZlUHJlZml4KGlucHV0VmFsdWUpKSwgdGhpcy5kcm9wU3BlY2lhbENoYXJhY3RlcnMpKVxyXG4gICAgICApO1xyXG4gICAgfSBlbHNlIGlmICh0aGlzLmRyb3BTcGVjaWFsQ2hhcmFjdGVycykge1xyXG4gICAgICB0aGlzLm9uQ2hhbmdlKHRoaXMuX3RvTnVtYmVyKHRoaXMuX2NoZWNrU3ltYm9scyhpbnB1dFZhbHVlKSkpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdGhpcy5vbkNoYW5nZSh0aGlzLl9yZW1vdmVTdWZmaXgoaW5wdXRWYWx1ZSkpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBfdG9OdW1iZXIodmFsdWU6IHN0cmluZyB8IG51bWJlciB8IHVuZGVmaW5lZCB8IG51bGwpIHtcclxuICAgIGlmICghdGhpcy5pc051bWJlclZhbHVlIHx8IHZhbHVlID09PSAnJykge1xyXG4gICAgICByZXR1cm4gdmFsdWU7XHJcbiAgICB9XHJcbiAgICBjb25zdCBudW0gPSBOdW1iZXIodmFsdWUpO1xyXG4gICAgcmV0dXJuIE51bWJlci5pc05hTihudW0pID8gdmFsdWUgOiBudW07XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIF9yZW1vdmVNYXNrKHZhbHVlOiBzdHJpbmcsIHNwZWNpYWxDaGFyYWN0ZXJzRm9yUmVtb3ZlOiBzdHJpbmdbXSk6IHN0cmluZyB7XHJcbiAgICByZXR1cm4gdmFsdWUgPyB2YWx1ZS5yZXBsYWNlKHRoaXMuX3JlZ0V4cEZvclJlbW92ZShzcGVjaWFsQ2hhcmFjdGVyc0ZvclJlbW92ZSksICcnKSA6IHZhbHVlO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBfcmVtb3ZlUHJlZml4KHZhbHVlOiBzdHJpbmcpOiBzdHJpbmcge1xyXG4gICAgaWYgKCF0aGlzLnByZWZpeCkge1xyXG4gICAgICByZXR1cm4gdmFsdWU7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdmFsdWUgPyB2YWx1ZS5yZXBsYWNlKHRoaXMucHJlZml4LCAnJykgOiB2YWx1ZTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgX3JlbW92ZVN1ZmZpeCh2YWx1ZTogc3RyaW5nKTogc3RyaW5nIHtcclxuICAgIGlmICghdGhpcy5zdWZmaXgpIHtcclxuICAgICAgcmV0dXJuIHZhbHVlO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHZhbHVlID8gdmFsdWUucmVwbGFjZSh0aGlzLnN1ZmZpeCwgJycpIDogdmFsdWU7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIF9yZXRyaWV2ZVNlcGFyYXRvclZhbHVlKHJlc3VsdDogc3RyaW5nKTogc3RyaW5nIHtcclxuICAgIHJldHVybiB0aGlzLl9yZW1vdmVNYXNrKHRoaXMuX3JlbW92ZVN1ZmZpeCh0aGlzLl9yZW1vdmVQcmVmaXgocmVzdWx0KSksIHRoaXMubWFza1NwZWNpYWxDaGFyYWN0ZXJzKTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgX3JlZ0V4cEZvclJlbW92ZShzcGVjaWFsQ2hhcmFjdGVyc0ZvclJlbW92ZTogc3RyaW5nW10pOiBSZWdFeHAge1xyXG4gICAgcmV0dXJuIG5ldyBSZWdFeHAoc3BlY2lhbENoYXJhY3RlcnNGb3JSZW1vdmUubWFwKChpdGVtOiBzdHJpbmcpID0+IGBcXFxcJHtpdGVtfWApLmpvaW4oJ3wnKSwgJ2dpJyk7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIF9jaGVja1N5bWJvbHMocmVzdWx0OiBzdHJpbmcpOiBzdHJpbmcgfCBudW1iZXIgfCB1bmRlZmluZWQgfCBudWxsIHtcclxuICAgIGlmIChyZXN1bHQgPT09ICcnKSB7XHJcbiAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3Qgc2VwYXJhdG9yUHJlY2lzaW9uOiBudW1iZXIgfCBudWxsID0gdGhpcy5fcmV0cmlldmVTZXBhcmF0b3JQcmVjaXNpb24odGhpcy5tYXNrRXhwcmVzc2lvbik7XHJcbiAgICBsZXQgc2VwYXJhdG9yVmFsdWU6IHN0cmluZyA9IHRoaXMuX3JldHJpZXZlU2VwYXJhdG9yVmFsdWUocmVzdWx0KTtcclxuICAgIGlmICh0aGlzLmRlY2ltYWxNYXJrZXIgIT09ICcuJykge1xyXG4gICAgICBzZXBhcmF0b3JWYWx1ZSA9IHNlcGFyYXRvclZhbHVlLnJlcGxhY2UodGhpcy5kZWNpbWFsTWFya2VyLCAnLicpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICghdGhpcy5pc051bWJlclZhbHVlKSB7XHJcbiAgICAgIHJldHVybiBzZXBhcmF0b3JWYWx1ZTtcclxuICAgIH1cclxuICAgIGlmIChzZXBhcmF0b3JQcmVjaXNpb24pIHtcclxuICAgICAgaWYgKHJlc3VsdCA9PT0gdGhpcy5kZWNpbWFsTWFya2VyKSB7XHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIHRoaXMuX2NoZWNrUHJlY2lzaW9uKHRoaXMubWFza0V4cHJlc3Npb24sIHNlcGFyYXRvclZhbHVlKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHJldHVybiBOdW1iZXIoc2VwYXJhdG9yVmFsdWUpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLy8gVE9ETyBzaG91bGQgdGhpbmsgYWJvdXQgaGVscGVycyBvciBzZXBhcnRpbmcgZGVjaW1hbCBwcmVjaXNpb24gdG8gb3duIHByb3BlcnR5XHJcbiAgcHJpdmF0ZSBfcmV0cmlldmVTZXBhcmF0b3JQcmVjaXNpb24obWFza0V4cHJldGlvbjogc3RyaW5nKTogbnVtYmVyIHwgbnVsbCB7XHJcbiAgICBjb25zdCBtYXRjaGVyOiBSZWdFeHBNYXRjaEFycmF5IHwgbnVsbCA9IG1hc2tFeHByZXRpb24ubWF0Y2gobmV3IFJlZ0V4cChgXnNlcGFyYXRvclxcXFwuKFteZF0qKWApKTtcclxuICAgIHJldHVybiBtYXRjaGVyID8gTnVtYmVyKG1hdGNoZXJbMV0pIDogbnVsbDtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgX2NoZWNrUHJlY2lzaW9uKHNlcGFyYXRvckV4cHJlc3Npb246IHN0cmluZywgc2VwYXJhdG9yVmFsdWU6IHN0cmluZyk6IG51bWJlciB8IHN0cmluZyB7XHJcbiAgICBpZiAoc2VwYXJhdG9yRXhwcmVzc2lvbi5pbmRleE9mKCcyJykgPiAwKSB7XHJcbiAgICAgIHJldHVybiBOdW1iZXIoc2VwYXJhdG9yVmFsdWUpLnRvRml4ZWQoMik7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gTnVtYmVyKHNlcGFyYXRvclZhbHVlKTtcclxuICB9XHJcbn1cclxuIl19