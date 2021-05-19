import { __awaiter } from "tslib";
import { NG_VALIDATORS, NG_VALUE_ACCESSOR, } from '@angular/forms';
import { Directive, forwardRef, HostListener, Inject, Input } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { config, timeMasks, withoutValidation } from './config';
import { MaskService } from './mask.service';
// tslint:disable deprecation
// tslint:disable no-input-rename
export class MaskDirective {
    constructor(document, _maskService, _config) {
        this.document = document;
        this._maskService = _maskService;
        this._config = _config;
        this.maskExpression = '';
        this.specialCharacters = [];
        this.patterns = {};
        this.prefix = '';
        this.suffix = '';
        this.thousandSeparator = ' ';
        this.decimalMarker = '.';
        this.dropSpecialCharacters = null;
        this.hiddenInput = null;
        this.showMaskTyped = null;
        this.placeHolderCharacter = null;
        this.shownMaskExpression = null;
        this.showTemplate = null;
        this.clearIfNotMatch = null;
        this.validation = null;
        this.separatorLimit = null;
        this.allowNegativeNumbers = null;
        this.leadZeroDateTime = null;
        this._maskValue = '';
        this._position = null;
        this._maskExpressionArray = [];
        this._justPasted = false;
        this.onChange = (_) => { };
        this.onTouch = () => { };
    }
    ngOnChanges(changes) {
        const { maskExpression, specialCharacters, patterns, prefix, suffix, thousandSeparator, decimalMarker, dropSpecialCharacters, hiddenInput, showMaskTyped, placeHolderCharacter, shownMaskExpression, showTemplate, clearIfNotMatch, validation, separatorLimit, allowNegativeNumbers, leadZeroDateTime, } = changes;
        if (maskExpression) {
            this._maskValue = maskExpression.currentValue || '';
            if (maskExpression.currentValue && maskExpression.currentValue.split('||').length > 1) {
                this._maskExpressionArray = maskExpression.currentValue.split('||').sort((a, b) => {
                    return a.length - b.length;
                });
                this._maskValue = this._maskExpressionArray[0];
                this.maskExpression = this._maskExpressionArray[0];
                this._maskService.maskExpression = this._maskExpressionArray[0];
            }
        }
        if (specialCharacters) {
            if (!specialCharacters.currentValue || !Array.isArray(specialCharacters.currentValue)) {
                return;
            }
            else {
                this._maskService.maskSpecialCharacters = specialCharacters.currentValue || [];
            }
        }
        // Only overwrite the mask available patterns if a pattern has actually been passed in
        if (patterns && patterns.currentValue) {
            this._maskService.maskAvailablePatterns = patterns.currentValue;
        }
        if (prefix) {
            this._maskService.prefix = prefix.currentValue;
        }
        if (suffix) {
            this._maskService.suffix = suffix.currentValue;
        }
        if (thousandSeparator) {
            this._maskService.thousandSeparator = thousandSeparator.currentValue;
        }
        if (decimalMarker) {
            this._maskService.decimalMarker = decimalMarker.currentValue;
        }
        if (dropSpecialCharacters) {
            this._maskService.dropSpecialCharacters = dropSpecialCharacters.currentValue;
        }
        if (hiddenInput) {
            this._maskService.hiddenInput = hiddenInput.currentValue;
        }
        if (showMaskTyped) {
            this._maskService.showMaskTyped = showMaskTyped.currentValue;
        }
        if (placeHolderCharacter) {
            this._maskService.placeHolderCharacter = placeHolderCharacter.currentValue;
        }
        if (shownMaskExpression) {
            this._maskService.shownMaskExpression = shownMaskExpression.currentValue;
        }
        if (showTemplate) {
            this._maskService.showTemplate = showTemplate.currentValue;
        }
        if (clearIfNotMatch) {
            this._maskService.clearIfNotMatch = clearIfNotMatch.currentValue;
        }
        if (validation) {
            this._maskService.validation = validation.currentValue;
        }
        if (separatorLimit) {
            this._maskService.separatorLimit = separatorLimit.currentValue;
        }
        if (allowNegativeNumbers) {
            this._maskService.allowNegativeNumbers = allowNegativeNumbers.currentValue;
            if (this._maskService.allowNegativeNumbers) {
                this._maskService.maskSpecialCharacters = this._maskService.maskSpecialCharacters.filter((c) => c !== '-');
            }
        }
        if (leadZeroDateTime) {
            this._maskService.leadZeroDateTime = leadZeroDateTime.currentValue;
        }
        this._applyMask();
    }
    // tslint:disable-next-line: cyclomatic-complexity
    validate({ value }) {
        if (!this._maskService.validation || !this._maskValue) {
            return null;
        }
        if (this._maskService.ipError) {
            return this._createValidationError(value);
        }
        if (this._maskService.cpfCnpjError) {
            return this._createValidationError(value);
        }
        if (this._maskValue.startsWith('separator')) {
            return null;
        }
        if (withoutValidation.includes(this._maskValue)) {
            return null;
        }
        if (this._maskService.clearIfNotMatch) {
            return null;
        }
        if (timeMasks.includes(this._maskValue)) {
            return this._validateTime(value);
        }
        if (value && value.toString().length >= 1) {
            let counterOfOpt = 0;
            for (const key in this._maskService.maskAvailablePatterns) {
                if (this._maskService.maskAvailablePatterns[key].optional &&
                    this._maskService.maskAvailablePatterns[key].optional === true) {
                    if (this._maskValue.indexOf(key) !== this._maskValue.lastIndexOf(key)) {
                        const opt = this._maskValue
                            .split('')
                            .filter((i) => i === key)
                            .join('');
                        counterOfOpt += opt.length;
                    }
                    else if (this._maskValue.indexOf(key) !== -1) {
                        counterOfOpt++;
                    }
                    if (this._maskValue.indexOf(key) !== -1 && value.toString().length >= this._maskValue.indexOf(key)) {
                        return null;
                    }
                    if (counterOfOpt === this._maskValue.length) {
                        return null;
                    }
                }
            }
            if (this._maskValue.indexOf('{') === 1 &&
                value.toString().length === this._maskValue.length + Number(this._maskValue.split('{')[1].split('}')[0]) - 4) {
                return null;
            }
            if (this._maskValue.indexOf('*') === 1 || this._maskValue.indexOf('?') === 1) {
                return null;
            }
            else if ((this._maskValue.indexOf('*') > 1 && value.toString().length < this._maskValue.indexOf('*')) ||
                (this._maskValue.indexOf('?') > 1 && value.toString().length < this._maskValue.indexOf('?')) ||
                this._maskValue.indexOf('{') === 1) {
                return this._createValidationError(value);
            }
            if (this._maskValue.indexOf('*') === -1 || this._maskValue.indexOf('?') === -1) {
                const length = this._maskService.dropSpecialCharacters
                    ? this._maskValue.length - this._maskService.checkSpecialCharAmount(this._maskValue) - counterOfOpt
                    : this._maskValue.length - counterOfOpt;
                if (value.toString().length < length) {
                    return this._createValidationError(value);
                }
            }
        }
        return null;
    }
    onPaste() {
        this._justPasted = true;
    }
    onInput(e) {
        const el = e.target;
        this._inputValue = el.value;
        this._setMask();
        if (!this._maskValue) {
            this.onChange(el.value);
            return;
        }
        const position = el.selectionStart === 1
            ? el.selectionStart + this._maskService.prefix.length
            : el.selectionStart;
        let caretShift = 0;
        let backspaceShift = false;
        this._maskService.applyValueChanges(position, this._justPasted, this._code === 'Backspace', (shift, _backspaceShift) => {
            this._justPasted = false;
            caretShift = shift;
            backspaceShift = _backspaceShift;
        });
        // only set the selection if the element is active
        if (this.document.activeElement !== el) {
            return;
        }
        this._position = this._position === 1 && this._inputValue.length === 1 ? null : this._position;
        let positionToApply = this._position
            ? this._inputValue.length + position + caretShift
            : position + (this._code === 'Backspace' && !backspaceShift ? 0 : caretShift);
        if (positionToApply > this._getActualInputLength()) {
            positionToApply = this._getActualInputLength();
        }
        el.setSelectionRange(positionToApply, positionToApply);
        this._position = null;
    }
    onBlur() {
        if (this._maskValue) {
            this._maskService.clearIfNotMatchFn();
        }
        this.onTouch();
    }
    onFocus(e) {
        if (!this._maskValue) {
            return;
        }
        const el = e.target;
        const posStart = 0;
        const posEnd = 0;
        if (el !== null &&
            el.selectionStart !== null &&
            el.selectionStart === el.selectionEnd &&
            el.selectionStart > this._maskService.prefix.length &&
            // tslint:disable-next-line
            e.keyCode !== 38) {
            if (this._maskService.showMaskTyped) {
                // We are showing the mask in the input
                this._maskService.maskIsShown = this._maskService.showMaskInInput();
                if (el.setSelectionRange && this._maskService.prefix + this._maskService.maskIsShown === el.value) {
                    // the input ONLY contains the mask, so position the cursor at the start
                    el.focus();
                    el.setSelectionRange(posStart, posEnd);
                }
                else {
                    // the input contains some characters already
                    if (el.selectionStart > this._maskService.actualValue.length) {
                        // if the user clicked beyond our value's length, position the cursor at the end of our value
                        el.setSelectionRange(this._maskService.actualValue.length, this._maskService.actualValue.length);
                    }
                }
            }
        }
        const nextValue = !el.value || el.value === this._maskService.prefix
            ? this._maskService.prefix + this._maskService.maskIsShown
            : el.value;
        /** Fix of cursor position jumping to end in most browsers no matter where cursor is inserted onFocus */
        if (el.value !== nextValue) {
            el.value = nextValue;
        }
        /** fix of cursor position with prefix when mouse click occur */
        if ((el.selectionStart || el.selectionEnd) <= this._maskService.prefix.length) {
            el.selectionStart = this._maskService.prefix.length;
            return;
        }
        /** select only inserted text */
        if (el.selectionEnd > this._getActualInputLength()) {
            el.selectionEnd = this._getActualInputLength();
        }
    }
    // tslint:disable-next-line: cyclomatic-complexity
    onKeyDown(e) {
        var _a;
        if (!this._maskValue) {
            return;
        }
        this._code = e.code ? e.code : e.key;
        const el = e.target;
        this._inputValue = el.value;
        this._setMask();
        if (e.keyCode === 38) {
            e.preventDefault();
        }
        if (e.keyCode === 37 || e.keyCode === 8 || e.keyCode === 46) {
            if (e.keyCode === 8 && el.value.length === 0) {
                el.selectionStart = el.selectionEnd;
            }
            if (e.keyCode === 8 && el.selectionStart !== 0) {
                // If specialChars is false, (shouldn't ever happen) then set to the defaults
                this.specialCharacters = ((_a = this.specialCharacters) === null || _a === void 0 ? void 0 : _a.length) ? this.specialCharacters
                    : this._config.specialCharacters;
                if (this.prefix.length > 1 && el.selectionStart <= this.prefix.length) {
                    el.setSelectionRange(this.prefix.length, this.prefix.length);
                }
                else {
                    if (this._inputValue.length !== el.selectionStart && el.selectionStart !== 1) {
                        while (this.specialCharacters.includes(this._inputValue[el.selectionStart - 1].toString()) &&
                            ((this.prefix.length >= 1 && el.selectionStart > this.prefix.length) ||
                                this.prefix.length === 0)) {
                            el.setSelectionRange(el.selectionStart - 1, el.selectionStart - 1);
                        }
                    }
                    this.suffixCheckOnPressDelete(e.keyCode, el);
                }
            }
            this.suffixCheckOnPressDelete(e.keyCode, el);
            if (this._maskService.prefix.length &&
                el.selectionStart <= this._maskService.prefix.length &&
                el.selectionEnd <= this._maskService.prefix.length) {
                e.preventDefault();
            }
            const cursorStart = el.selectionStart;
            // this.onFocus(e);
            if (e.keyCode === 8 &&
                !el.readOnly &&
                cursorStart === 0 &&
                el.selectionEnd === el.value.length &&
                el.value.length !== 0) {
                this._position = this._maskService.prefix ? this._maskService.prefix.length : 0;
                this._maskService.applyMask(this._maskService.prefix, this._maskService.maskExpression, this._position);
            }
        }
        if (!!this.suffix &&
            this.suffix.length > 1 &&
            this._inputValue.length - this.suffix.length < el.selectionStart) {
            el.setSelectionRange(this._inputValue.length - this.suffix.length, this._inputValue.length);
        }
        else if ((e.keyCode === 65 && e.ctrlKey === true) || // Ctrl+ A
            (e.keyCode === 65 && e.metaKey === true) // Cmd + A (Mac)
        ) {
            el.setSelectionRange(0, this._getActualInputLength());
            e.preventDefault();
        }
        this._maskService.selStart = el.selectionStart;
        this._maskService.selEnd = el.selectionEnd;
    }
    /** It writes the value in the input */
    writeValue(inputValue) {
        return __awaiter(this, void 0, void 0, function* () {
            if (typeof inputValue === 'object' && inputValue !== null && 'value' in inputValue) {
                if ('disable' in inputValue) {
                    this.setDisabledState(Boolean(inputValue.disable));
                }
                inputValue = inputValue.value;
            }
            if (inputValue === undefined) {
                inputValue = '';
            }
            if (typeof inputValue === 'number') {
                inputValue = String(inputValue);
                inputValue = this.decimalMarker !== '.' ? inputValue.replace('.', this.decimalMarker) : inputValue;
                this._maskService.isNumberValue = true;
            }
            this._inputValue = inputValue;
            this._setMask();
            if ((inputValue && this._maskService.maskExpression) ||
                (this._maskService.maskExpression && (this._maskService.prefix || this._maskService.showMaskTyped))) {
                // Let the service we know we are writing value so that triggering onChange function wont happen during applyMask
                this._maskService.writingValue = true;
                this._maskService.formElementProperty = [
                    'value',
                    this._maskService.applyMask(inputValue, this._maskService.maskExpression),
                ];
                // Let the service know we've finished writing value
                this._maskService.writingValue = false;
            }
            else {
                this._maskService.formElementProperty = ['value', inputValue];
            }
            this._inputValue = inputValue;
        });
    }
    registerOnChange(fn) {
        this.onChange = fn;
        this._maskService.onChange = this.onChange;
    }
    registerOnTouched(fn) {
        this.onTouch = fn;
    }
    suffixCheckOnPressDelete(keyCode, el) {
        if (keyCode === 46 && this.suffix.length > 0) {
            if (this._inputValue.length - this.suffix.length <= el.selectionStart) {
                el.setSelectionRange(this._inputValue.length - this.suffix.length, this._inputValue.length);
            }
        }
        if (keyCode === 8) {
            if (this.suffix.length > 1 && this._inputValue.length - this.suffix.length < el.selectionStart) {
                el.setSelectionRange(this._inputValue.length - this.suffix.length, this._inputValue.length);
            }
            if (this.suffix.length === 1 && this._inputValue.length === el.selectionStart) {
                el.setSelectionRange(el.selectionStart - 1, el.selectionStart - 1);
            }
        }
    }
    /** It disables the input element */
    setDisabledState(isDisabled) {
        this._maskService.formElementProperty = ['disabled', isDisabled];
    }
    _repeatPatternSymbols(maskExp) {
        return ((maskExp.match(/{[0-9]+}/) &&
            maskExp.split('').reduce((accum, currval, index) => {
                this._start = currval === '{' ? index : this._start;
                if (currval !== '}') {
                    return this._maskService._findSpecialChar(currval) ? accum + currval : accum;
                }
                this._end = index;
                const repeatNumber = Number(maskExp.slice(this._start + 1, this._end));
                const replaceWith = new Array(repeatNumber + 1).join(maskExp[this._start - 1]);
                return accum + replaceWith;
            }, '')) ||
            maskExp);
    }
    // tslint:disable-next-line:no-any
    _applyMask() {
        this._maskService.maskExpression = this._repeatPatternSymbols(this._maskValue || '');
        this._maskService.formElementProperty = [
            'value',
            this._maskService.applyMask(this._inputValue, this._maskService.maskExpression),
        ];
    }
    _validateTime(value) {
        const rowMaskLen = this._maskValue.split('').filter((s) => s !== ':').length;
        if (!value) {
            return null; // Don't validate empty values to allow for optional form control
        }
        if ((+value[value.length - 1] === 0 && value.length < rowMaskLen) || value.length <= rowMaskLen - 2) {
            return this._createValidationError(value);
        }
        return null;
    }
    _getActualInputLength() {
        return (this._maskService.actualValue.length || this._maskService.actualValue.length + this._maskService.prefix.length);
    }
    _createValidationError(actualValue) {
        return {
            mask: {
                requiredMask: this._maskValue,
                actualValue,
            },
        };
    }
    _setMask() {
        if (this._maskExpressionArray.length > 0) {
            this._maskExpressionArray.some((mask) => {
                var _a, _b;
                const test = this._inputValue &&
                    ((_a = this._maskService.removeMask(this._inputValue)) === null || _a === void 0 ? void 0 : _a.length) <= ((_b = this._maskService.removeMask(mask)) === null || _b === void 0 ? void 0 : _b.length);
                if (this._inputValue && test) {
                    this._maskValue = mask;
                    this.maskExpression = mask;
                    this._maskService.maskExpression = mask;
                    return test;
                }
                else {
                    this._maskValue = this._maskExpressionArray[this._maskExpressionArray.length - 1];
                    this.maskExpression = this._maskExpressionArray[this._maskExpressionArray.length - 1];
                    this._maskService.maskExpression = this._maskExpressionArray[this._maskExpressionArray.length - 1];
                }
            });
        }
    }
}
MaskDirective.decorators = [
    { type: Directive, args: [{
                selector: 'input[mask], textarea[mask]',
                providers: [
                    {
                        provide: NG_VALUE_ACCESSOR,
                        useExisting: forwardRef(() => MaskDirective),
                        multi: true,
                    },
                    {
                        provide: NG_VALIDATORS,
                        useExisting: forwardRef(() => MaskDirective),
                        multi: true,
                    },
                    MaskService,
                ],
            },] }
];
MaskDirective.ctorParameters = () => [
    { type: undefined, decorators: [{ type: Inject, args: [DOCUMENT,] }] },
    { type: MaskService },
    { type: undefined, decorators: [{ type: Inject, args: [config,] }] }
];
MaskDirective.propDecorators = {
    maskExpression: [{ type: Input, args: ['mask',] }],
    specialCharacters: [{ type: Input }],
    patterns: [{ type: Input }],
    prefix: [{ type: Input }],
    suffix: [{ type: Input }],
    thousandSeparator: [{ type: Input }],
    decimalMarker: [{ type: Input }],
    dropSpecialCharacters: [{ type: Input }],
    hiddenInput: [{ type: Input }],
    showMaskTyped: [{ type: Input }],
    placeHolderCharacter: [{ type: Input }],
    shownMaskExpression: [{ type: Input }],
    showTemplate: [{ type: Input }],
    clearIfNotMatch: [{ type: Input }],
    validation: [{ type: Input }],
    separatorLimit: [{ type: Input }],
    allowNegativeNumbers: [{ type: Input }],
    leadZeroDateTime: [{ type: Input }],
    onPaste: [{ type: HostListener, args: ['paste',] }],
    onInput: [{ type: HostListener, args: ['input', ['$event'],] }],
    onBlur: [{ type: HostListener, args: ['blur',] }],
    onFocus: [{ type: HostListener, args: ['click', ['$event'],] }],
    onKeyDown: [{ type: HostListener, args: ['keydown', ['$event'],] }]
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFzay5kaXJlY3RpdmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9wcm9qZWN0cy9uZ3gtbWFzay1saWIvc3JjL2xpYi9tYXNrLmRpcmVjdGl2ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsT0FBTyxFQUdMLGFBQWEsRUFDYixpQkFBaUIsR0FHbEIsTUFBTSxnQkFBZ0IsQ0FBQztBQUN4QixPQUFPLEVBQUUsU0FBUyxFQUFFLFVBQVUsRUFBRSxZQUFZLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBNEIsTUFBTSxlQUFlLENBQUM7QUFDN0csT0FBTyxFQUFFLFFBQVEsRUFBRSxNQUFNLGlCQUFpQixDQUFDO0FBRzNDLE9BQU8sRUFBRSxNQUFNLEVBQVcsU0FBUyxFQUFFLGlCQUFpQixFQUFFLE1BQU0sVUFBVSxDQUFDO0FBQ3pFLE9BQU8sRUFBRSxXQUFXLEVBQUUsTUFBTSxnQkFBZ0IsQ0FBQztBQUU3Qyw2QkFBNkI7QUFDN0IsaUNBQWlDO0FBaUJqQyxNQUFNLE9BQU8sYUFBYTtJQTRCeEIsWUFDNEIsUUFBYSxFQUMvQixZQUF5QixFQUNQLE9BQWdCO1FBRmhCLGFBQVEsR0FBUixRQUFRLENBQUs7UUFDL0IsaUJBQVksR0FBWixZQUFZLENBQWE7UUFDUCxZQUFPLEdBQVAsT0FBTyxDQUFTO1FBOUJ0QixtQkFBYyxHQUFXLEVBQUUsQ0FBQztRQUNsQyxzQkFBaUIsR0FBaUMsRUFBRSxDQUFDO1FBQ3JELGFBQVEsR0FBd0IsRUFBRSxDQUFDO1FBQ25DLFdBQU0sR0FBc0IsRUFBRSxDQUFDO1FBQy9CLFdBQU0sR0FBc0IsRUFBRSxDQUFDO1FBQy9CLHNCQUFpQixHQUFpQyxHQUFHLENBQUM7UUFDdEQsa0JBQWEsR0FBNkIsR0FBRyxDQUFDO1FBQzlDLDBCQUFxQixHQUE0QyxJQUFJLENBQUM7UUFDdEUsZ0JBQVcsR0FBa0MsSUFBSSxDQUFDO1FBQ2xELGtCQUFhLEdBQW9DLElBQUksQ0FBQztRQUN0RCx5QkFBb0Is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Q29udHJvbFZhbHVlQWNjZXNzb3IsXHJcbiAgRm9ybUNvbnRyb2wsXHJcbiAgTkdfVkFMSURBVE9SUyxcclxuICBOR19WQUxVRV9BQ0NFU1NPUixcclxuICBWYWxpZGF0aW9uRXJyb3JzLFxyXG4gIFZhbGlkYXRvcixcclxufSBmcm9tICdAYW5ndWxhci9mb3Jtcyc7XHJcbmltcG9ydCB7IERpcmVjdGl2ZSwgZm9yd2FyZFJlZiwgSG9zdExpc3RlbmVyLCBJbmplY3QsIElucHV0LCBPbkNoYW5nZXMsIFNpbXBsZUNoYW5nZXMgfSBmcm9tICdAYW5ndWxhci9jb3JlJztcclxuaW1wb3J0IHsgRE9DVU1FTlQgfSBmcm9tICdAYW5ndWxhci9jb21tb24nO1xyXG5cclxuaW1wb3J0IHsgQ3VzdG9tS2V5Ym9hcmRFdmVudCB9IGZyb20gJy4vY3VzdG9tLWtleWJvYXJkLWV2ZW50JztcclxuaW1wb3J0IHsgY29uZmlnLCBJQ29uZmlnLCB0aW1lTWFza3MsIHdpdGhvdXRWYWxpZGF0aW9uIH0gZnJvbSAnLi9jb25maWcnO1xyXG5pbXBvcnQgeyBNYXNrU2VydmljZSB9IGZyb20gJy4vbWFzay5zZXJ2aWNlJztcclxuXHJcbi8vIHRzbGludDpkaXNhYmxlIGRlcHJlY2F0aW9uXHJcbi8vIHRzbGludDpkaXNhYmxlIG5vLWlucHV0LXJlbmFtZVxyXG5ARGlyZWN0aXZlKHtcclxuICBzZWxlY3RvcjogJ2lucHV0W21hc2tdLCB0ZXh0YXJlYVttYXNrXScsXHJcbiAgcHJvdmlkZXJzOiBbXHJcbiAgICB7XHJcbiAgICAgIHByb3ZpZGU6IE5HX1ZBTFVFX0FDQ0VTU09SLFxyXG4gICAgICB1c2VFeGlzdGluZzogZm9yd2FyZFJlZigoKSA9PiBNYXNrRGlyZWN0aXZlKSxcclxuICAgICAgbXVsdGk6IHRydWUsXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICBwcm92aWRlOiBOR19WQUxJREFUT1JTLFxyXG4gICAgICB1c2VFeGlzdGluZzogZm9yd2FyZFJlZigoKSA9PiBNYXNrRGlyZWN0aXZlKSxcclxuICAgICAgbXVsdGk6IHRydWUsXHJcbiAgICB9LFxyXG4gICAgTWFza1NlcnZpY2UsXHJcbiAgXSxcclxufSlcclxuZXhwb3J0IGNsYXNzIE1hc2tEaXJlY3RpdmUgaW1wbGVtZW50cyBDb250cm9sVmFsdWVBY2Nlc3NvciwgT25DaGFuZ2VzLCBWYWxpZGF0b3Ige1xyXG4gIEBJbnB1dCgnbWFzaycpIHB1YmxpYyBtYXNrRXhwcmVzc2lvbjogc3RyaW5nID0gJyc7XHJcbiAgQElucHV0KCkgcHVibGljIHNwZWNpYWxDaGFyYWN0ZXJzOiBJQ29uZmlnWydzcGVjaWFsQ2hhcmFjdGVycyddID0gW107XHJcbiAgQElucHV0KCkgcHVibGljIHBhdHRlcm5zOiBJQ29uZmlnWydwYXR0ZXJucyddID0ge307XHJcbiAgQElucHV0KCkgcHVibGljIHByZWZpeDogSUNvbmZpZ1sncHJlZml4J10gPSAnJztcclxuICBASW5wdXQoKSBwdWJsaWMgc3VmZml4OiBJQ29uZmlnWydzdWZmaXgnXSA9ICcnO1xyXG4gIEBJbnB1dCgpIHB1YmxpYyB0aG91c2FuZFNlcGFyYXRvcjogSUNvbmZpZ1sndGhvdXNhbmRTZXBhcmF0b3InXSA9ICcgJztcclxuICBASW5wdXQoKSBwdWJsaWMgZGVjaW1hbE1hcmtlcjogSUNvbmZpZ1snZGVjaW1hbE1hcmtlciddID0gJy4nO1xyXG4gIEBJbnB1dCgpIHB1YmxpYyBkcm9wU3BlY2lhbENoYXJhY3RlcnM6IElDb25maWdbJ2Ryb3BTcGVjaWFsQ2hhcmFjdGVycyddIHwgbnVsbCA9IG51bGw7XHJcbiAgQElucHV0KCkgcHVibGljIGhpZGRlbklucHV0OiBJQ29uZmlnWydoaWRkZW5JbnB1dCddIHwgbnVsbCA9IG51bGw7XHJcbiAgQElucHV0KCkgcHVibGljIHNob3dNYXNrVHlwZWQ6IElDb25maWdbJ3Nob3dNYXNrVHlwZWQnXSB8IG51bGwgPSBudWxsO1xyXG4gIEBJbnB1dCgpIHB1YmxpYyBwbGFjZUhvbGRlckNoYXJhY3RlcjogSUNvbmZpZ1sncGxhY2VIb2xkZXJDaGFyYWN0ZXInXSB8IG51bGwgPSBudWxsO1xyXG4gIEBJbnB1dCgpIHB1YmxpYyBzaG93bk1hc2tFeHByZXNzaW9uOiBJQ29uZmlnWydzaG93bk1hc2tFeHByZXNzaW9uJ10gfCBudWxsID0gbnVsbDtcclxuICBASW5wdXQoKSBwdWJsaWMgc2hvd1RlbXBsYXRlOiBJQ29uZmlnWydzaG93VGVtcGxhdGUnXSB8IG51bGwgPSBudWxsO1xyXG4gIEBJbnB1dCgpIHB1YmxpYyBjbGVhcklmTm90TWF0Y2g6IElDb25maWdbJ2NsZWFySWZOb3RNYXRjaCddIHwgbnVsbCA9IG51bGw7XHJcbiAgQElucHV0KCkgcHVibGljIHZhbGlkYXRpb246IElDb25maWdbJ3ZhbGlkYXRpb24nXSB8IG51bGwgPSBudWxsO1xyXG4gIEBJbnB1dCgpIHB1YmxpYyBzZXBhcmF0b3JMaW1pdDogSUNvbmZpZ1snc2VwYXJhdG9yTGltaXQnXSB8IG51bGwgPSBudWxsO1xyXG4gIEBJbnB1dCgpIHB1YmxpYyBhbGxvd05lZ2F0aXZlTnVtYmVyczogSUNvbmZpZ1snYWxsb3dOZWdhdGl2ZU51bWJlcnMnXSB8IG51bGwgPSBudWxsO1xyXG4gIEBJbnB1dCgpIHB1YmxpYyBsZWFkWmVyb0RhdGVUaW1lOiBJQ29uZmlnWydsZWFkWmVyb0RhdGVUaW1lJ10gfCBudWxsID0gbnVsbDtcclxuICBwcml2YXRlIF9tYXNrVmFsdWU6IHN0cmluZyA9ICcnO1xyXG4gIHByaXZhdGUgX2lucHV0VmFsdWUhOiBzdHJpbmc7XHJcbiAgcHJpdmF0ZSBfcG9zaXRpb246IG51bWJlciB8IG51bGwgPSBudWxsO1xyXG4gIHByaXZhdGUgX3N0YXJ0ITogbnVtYmVyO1xyXG4gIHByaXZhdGUgX2VuZCE6IG51bWJlcjtcclxuICBwcml2YXRlIF9jb2RlITogc3RyaW5nO1xyXG4gIHByaXZhdGUgX21hc2tFeHByZXNzaW9uQXJyYXk6IHN0cmluZ1tdID0gW107XHJcbiAgcHJpdmF0ZSBfanVzdFBhc3RlZDogYm9vbGVhbiA9IGZhbHNlO1xyXG5cclxuICBwdWJsaWMgY29uc3RydWN0b3IoXHJcbiAgICBASW5qZWN0KERPQ1VNRU5UKSBwcml2YXRlIGRvY3VtZW50OiBhbnksXHJcbiAgICBwcml2YXRlIF9tYXNrU2VydmljZTogTWFza1NlcnZpY2UsXHJcbiAgICBASW5qZWN0KGNvbmZpZykgcHJvdGVjdGVkIF9jb25maWc6IElDb25maWdcclxuICApIHt9XHJcblxyXG4gIHB1YmxpYyBvbkNoYW5nZSA9IChfOiBhbnkpID0+IHt9O1xyXG4gIHB1YmxpYyBvblRvdWNoID0gKCkgPT4ge307XHJcblxyXG4gIHB1YmxpYyBuZ09uQ2hhbmdlcyhjaGFuZ2VzOiBTaW1wbGVDaGFuZ2VzKTogdm9pZCB7XHJcbiAgICBjb25zdCB7XHJcbiAgICAgIG1hc2tFeHByZXNzaW9uLFxyXG4gICAgICBzcGVjaWFsQ2hhcmFjdGVycyxcclxuICAgICAgcGF0dGVybnMsXHJcbiAgICAgIHByZWZpeCxcclxuICAgICAgc3VmZml4LFxyXG4gICAgICB0aG91c2FuZFNlcGFyYXRvcixcclxuICAgICAgZGVjaW1hbE1hcmtlcixcclxuICAgICAgZHJvcFNwZWNpYWxDaGFyYWN0ZXJzLFxyXG4gICAgICBoaWRkZW5JbnB1dCxcclxuICAgICAgc2hvd01hc2tUeXBlZCxcclxuICAgICAgcGxhY2VIb2xkZXJDaGFyYWN0ZXIsXHJcbiAgICAgIHNob3duTWFza0V4cHJlc3Npb24sXHJcbiAgICAgIHNob3dUZW1wbGF0ZSxcclxuICAgICAgY2xlYXJJZk5vdE1hdGNoLFxyXG4gICAgICB2YWxpZGF0aW9uLFxyXG4gICAgICBzZXBhcmF0b3JMaW1pdCxcclxuICAgICAgYWxsb3dOZWdhdGl2ZU51bWJlcnMsXHJcbiAgICAgIGxlYWRaZXJvRGF0ZVRpbWUsXHJcbiAgICB9ID0gY2hhbmdlcztcclxuICAgIGlmIChtYXNrRXhwcmVzc2lvbikge1xyXG4gICAgICB0aGlzLl9tYXNrVmFsdWUgPSBtYXNrRXhwcmVzc2lvbi5jdXJyZW50VmFsdWUgfHwgJyc7XHJcbiAgICAgIGlmIChtYXNrRXhwcmVzc2lvbi5jdXJyZW50VmFsdWUgJiYgbWFza0V4cHJlc3Npb24uY3VycmVudFZhbHVlLnNwbGl0KCd8fCcpLmxlbmd0aCA+IDEpIHtcclxuICAgICAgICB0aGlzLl9tYXNrRXhwcmVzc2lvbkFycmF5ID0gbWFza0V4cHJlc3Npb24uY3VycmVudFZhbHVlLnNwbGl0KCd8fCcpLnNvcnQoKGE6IHN0cmluZywgYjogc3RyaW5nKSA9PiB7XHJcbiAgICAgICAgICByZXR1cm4gYS5sZW5ndGggLSBiLmxlbmd0aDtcclxuICAgICAgICB9KTtcclxuICAgICAgICB0aGlzLl9tYXNrVmFsdWUgPSB0aGlzLl9tYXNrRXhwcmVzc2lvbkFycmF5WzBdO1xyXG4gICAgICAgIHRoaXMubWFza0V4cHJlc3Npb24gPSB0aGlzLl9tYXNrRXhwcmVzc2lvbkFycmF5WzBdO1xyXG4gICAgICAgIHRoaXMuX21hc2tTZXJ2aWNlLm1hc2tFeHByZXNzaW9uID0gdGhpcy5fbWFza0V4cHJlc3Npb25BcnJheVswXTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgaWYgKHNwZWNpYWxDaGFyYWN0ZXJzKSB7XHJcbiAgICAgIGlmICghc3BlY2lhbENoYXJhY3RlcnMuY3VycmVudFZhbHVlIHx8ICFBcnJheS5pc0FycmF5KHNwZWNpYWxDaGFyYWN0ZXJzLmN1cnJlbnRWYWx1ZSkpIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdGhpcy5fbWFza1NlcnZpY2UubWFza1NwZWNpYWxDaGFyYWN0ZXJzID0gc3BlY2lhbENoYXJhY3RlcnMuY3VycmVudFZhbHVlIHx8IFtdO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICAvLyBPbmx5IG92ZXJ3cml0ZSB0aGUgbWFzayBhdmFpbGFibGUgcGF0dGVybnMgaWYgYSBwYXR0ZXJuIGhhcyBhY3R1YWxseSBiZWVuIHBhc3NlZCBpblxyXG4gICAgaWYgKHBhdHRlcm5zICYmIHBhdHRlcm5zLmN1cnJlbnRWYWx1ZSkge1xyXG4gICAgICB0aGlzLl9tYXNrU2VydmljZS5tYXNrQXZhaWxhYmxlUGF0dGVybnMgPSBwYXR0ZXJucy5jdXJyZW50VmFsdWU7XHJcbiAgICB9XHJcbiAgICBpZiAocHJlZml4KSB7XHJcbiAgICAgIHRoaXMuX21hc2tTZXJ2aWNlLnByZWZpeCA9IHByZWZpeC5jdXJyZW50VmFsdWU7XHJcbiAgICB9XHJcbiAgICBpZiAoc3VmZml4KSB7XHJcbiAgICAgIHRoaXMuX21hc2tTZXJ2aWNlLnN1ZmZpeCA9IHN1ZmZpeC5jdXJyZW50VmFsdWU7XHJcbiAgICB9XHJcbiAgICBpZiAodGhvdXNhbmRTZXBhcmF0b3IpIHtcclxuICAgICAgdGhpcy5fbWFza1NlcnZpY2UudGhvdXNhbmRTZXBhcmF0b3IgPSB0aG91c2FuZFNlcGFyYXRvci5jdXJyZW50VmFsdWU7XHJcbiAgICB9XHJcbiAgICBpZiAoZGVjaW1hbE1hcmtlcikge1xyXG4gICAgICB0aGlzLl9tYXNrU2VydmljZS5kZWNpbWFsTWFya2VyID0gZGVjaW1hbE1hcmtlci5jdXJyZW50VmFsdWU7XHJcbiAgICB9XHJcbiAgICBpZiAoZHJvcFNwZWNpYWxDaGFyYWN0ZXJzKSB7XHJcbiAgICAgIHRoaXMuX21hc2tTZXJ2aWNlLmRyb3BTcGVjaWFsQ2hhcmFjdGVycyA9IGRyb3BTcGVjaWFsQ2hhcmFjdGVycy5jdXJyZW50VmFsdWU7XHJcbiAgICB9XHJcbiAgICBpZiAoaGlkZGVuSW5wdXQpIHtcclxuICAgICAgdGhpcy5fbWFza1NlcnZpY2UuaGlkZGVuSW5wdXQgPSBoaWRkZW5JbnB1dC5jdXJyZW50VmFsdWU7XHJcbiAgICB9XHJcbiAgICBpZiAoc2hvd01hc2tUeXBlZCkge1xyXG4gICAgICB0aGlzLl9tYXNrU2VydmljZS5zaG93TWFza1R5cGVkID0gc2hvd01hc2tUeXBlZC5jdXJyZW50VmFsdWU7XHJcbiAgICB9XHJcbiAgICBpZiAocGxhY2VIb2xkZXJDaGFyYWN0ZXIpIHtcclxuICAgICAgdGhpcy5fbWFza1NlcnZpY2UucGxhY2VIb2xkZXJDaGFyYWN0ZXIgPSBwbGFjZUhvbGRlckNoYXJhY3Rlci5jdXJyZW50VmFsdWU7XHJcbiAgICB9XHJcbiAgICBpZiAoc2hvd25NYXNrRXhwcmVzc2lvbikge1xyXG4gICAgICB0aGlzLl9tYXNrU2VydmljZS5zaG93bk1hc2tFeHByZXNzaW9uID0gc2hvd25NYXNrRXhwcmVzc2lvbi5jdXJyZW50VmFsdWU7XHJcbiAgICB9XHJcbiAgICBpZiAoc2hvd1RlbXBsYXRlKSB7XHJcbiAgICAgIHRoaXMuX21hc2tTZXJ2aWNlLnNob3dUZW1wbGF0ZSA9IHNob3dUZW1wbGF0ZS5jdXJyZW50VmFsdWU7XHJcbiAgICB9XHJcbiAgICBpZiAoY2xlYXJJZk5vdE1hdGNoKSB7XHJcbiAgICAgIHRoaXMuX21hc2tTZXJ2aWNlLmNsZWFySWZOb3RNYXRjaCA9IGNsZWFySWZOb3RNYXRjaC5jdXJyZW50VmFsdWU7XHJcbiAgICB9XHJcbiAgICBpZiAodmFsaWRhdGlvbikge1xyXG4gICAgICB0aGlzLl9tYXNrU2VydmljZS52YWxpZGF0aW9uID0gdmFsaWRhdGlvbi5jdXJyZW50VmFsdWU7XHJcbiAgICB9XHJcbiAgICBpZiAoc2VwYXJhdG9yTGltaXQpIHtcclxuICAgICAgdGhpcy5fbWFza1NlcnZpY2Uuc2VwYXJhdG9yTGltaXQgPSBzZXBhcmF0b3JMaW1pdC5jdXJyZW50VmFsdWU7XHJcbiAgICB9XHJcbiAgICBpZiAoYWxsb3dOZWdhdGl2ZU51bWJlcnMpIHtcclxuICAgICAgdGhpcy5fbWFza1NlcnZpY2UuYWxsb3dOZWdhdGl2ZU51bWJlcnMgPSBhbGxvd05lZ2F0aXZlTnVtYmVycy5jdXJyZW50VmFsdWU7XHJcbiAgICAgIGlmICh0aGlzLl9tYXNrU2VydmljZS5hbGxvd05lZ2F0aXZlTnVtYmVycykge1xyXG4gICAgICAgIHRoaXMuX21hc2tTZXJ2aWNlLm1hc2tTcGVjaWFsQ2hhcmFjdGVycyA9IHRoaXMuX21hc2tTZXJ2aWNlLm1hc2tTcGVjaWFsQ2hhcmFjdGVycy5maWx0ZXIoXHJcbiAgICAgICAgICAoYzogc3RyaW5nKSA9PiBjICE9PSAnLSdcclxuICAgICAgICApO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICBpZiAobGVhZFplcm9EYXRlVGltZSkge1xyXG4gICAgICB0aGlzLl9tYXNrU2VydmljZS5sZWFkWmVyb0RhdGVUaW1lID0gbGVhZFplcm9EYXRlVGltZS5jdXJyZW50VmFsdWU7XHJcbiAgICB9XHJcbiAgICB0aGlzLl9hcHBseU1hc2soKTtcclxuICB9XHJcblxyXG4gIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTogY3ljbG9tYXRpYy1jb21wbGV4aXR5XHJcbiAgcHVibGljIHZhbGlkYXRlKHsgdmFsdWUgfTogRm9ybUNvbnRyb2wpOiBWYWxpZGF0aW9uRXJyb3JzIHwgbnVsbCB7XHJcbiAgICBpZiAoIXRoaXMuX21hc2tTZXJ2aWNlLnZhbGlkYXRpb24gfHwgIXRoaXMuX21hc2tWYWx1ZSkge1xyXG4gICAgICByZXR1cm4gbnVsbDtcclxuICAgIH1cclxuICAgIGlmICh0aGlzLl9tYXNrU2VydmljZS5pcEVycm9yKSB7XHJcbiAgICAgIHJldHVybiB0aGlzLl9jcmVhdGVWYWxpZGF0aW9uRXJyb3IodmFsdWUpO1xyXG4gICAgfVxyXG4gICAgaWYgKHRoaXMuX21hc2tTZXJ2aWNlLmNwZkNucGpFcnJvcikge1xyXG4gICAgICByZXR1cm4gdGhpcy5fY3JlYXRlVmFsaWRhdGlvbkVycm9yKHZhbHVlKTtcclxuICAgIH1cclxuICAgIGlmICh0aGlzLl9tYXNrVmFsdWUuc3RhcnRzV2l0aCgnc2VwYXJhdG9yJykpIHtcclxuICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcbiAgICBpZiAod2l0aG91dFZhbGlkYXRpb24uaW5jbHVkZXModGhpcy5fbWFza1ZhbHVlKSkge1xyXG4gICAgICByZXR1cm4gbnVsbDtcclxuICAgIH1cclxuICAgIGlmICh0aGlzLl9tYXNrU2VydmljZS5jbGVhcklmTm90TWF0Y2gpIHtcclxuICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcbiAgICBpZiAodGltZU1hc2tzLmluY2x1ZGVzKHRoaXMuX21hc2tWYWx1ZSkpIHtcclxuICAgICAgcmV0dXJuIHRoaXMuX3ZhbGlkYXRlVGltZSh2YWx1ZSk7XHJcbiAgICB9XHJcbiAgICBpZiAodmFsdWUgJiYgdmFsdWUudG9TdHJpbmcoKS5sZW5ndGggPj0gMSkge1xyXG4gICAgICBsZXQgY291bnRlck9mT3B0ID0gMDtcclxuICAgICAgZm9yIChjb25zdCBrZXkgaW4gdGhpcy5fbWFza1NlcnZpY2UubWFza0F2YWlsYWJsZVBhdHRlcm5zKSB7XHJcbiAgICAgICAgaWYgKFxyXG4gICAgICAgICAgdGhpcy5fbWFza1NlcnZpY2UubWFza0F2YWlsYWJsZVBhdHRlcm5zW2tleV0ub3B0aW9uYWwgJiZcclxuICAgICAgICAgIHRoaXMuX21hc2tTZXJ2aWNlLm1hc2tBdmFpbGFibGVQYXR0ZXJuc1trZXldLm9wdGlvbmFsID09PSB0cnVlXHJcbiAgICAgICAgKSB7XHJcbiAgICAgICAgICBpZiAodGhpcy5fbWFza1ZhbHVlLmluZGV4T2Yoa2V5KSAhPT0gdGhpcy5fbWFza1ZhbHVlLmxhc3RJbmRleE9mKGtleSkpIHtcclxuICAgICAgICAgICAgY29uc3Qgb3B0OiBzdHJpbmcgPSB0aGlzLl9tYXNrVmFsdWVcclxuICAgICAgICAgICAgICAuc3BsaXQoJycpXHJcbiAgICAgICAgICAgICAgLmZpbHRlcigoaTogc3RyaW5nKSA9PiBpID09PSBrZXkpXHJcbiAgICAgICAgICAgICAgLmpvaW4oJycpO1xyXG4gICAgICAgICAgICBjb3VudGVyT2ZPcHQgKz0gb3B0Lmxlbmd0aDtcclxuICAgICAgICAgIH0gZWxzZSBpZiAodGhpcy5fbWFza1ZhbHVlLmluZGV4T2Yoa2V5KSAhPT0gLTEpIHtcclxuICAgICAgICAgICAgY291bnRlck9mT3B0Kys7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBpZiAodGhpcy5fbWFza1ZhbHVlLmluZGV4T2Yoa2V5KSAhPT0gLTEgJiYgdmFsdWUudG9TdHJpbmcoKS5sZW5ndGggPj0gdGhpcy5fbWFza1ZhbHVlLmluZGV4T2Yoa2V5KSkge1xyXG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGlmIChjb3VudGVyT2ZPcHQgPT09IHRoaXMuX21hc2tWYWx1ZS5sZW5ndGgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIGlmIChcclxuICAgICAgICB0aGlzLl9tYXNrVmFsdWUuaW5kZXhPZigneycpID09PSAxICYmXHJcbiAgICAgICAgdmFsdWUudG9TdHJpbmcoKS5sZW5ndGggPT09IHRoaXMuX21hc2tWYWx1ZS5sZW5ndGggKyBOdW1iZXIodGhpcy5fbWFza1ZhbHVlLnNwbGl0KCd7JylbMV0uc3BsaXQoJ30nKVswXSkgLSA0XHJcbiAgICAgICkge1xyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgICB9XHJcbiAgICAgIGlmICh0aGlzLl9tYXNrVmFsdWUuaW5kZXhPZignKicpID09PSAxIHx8IHRoaXMuX21hc2tWYWx1ZS5pbmRleE9mKCc/JykgPT09IDEpIHtcclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgfSBlbHNlIGlmIChcclxuICAgICAgICAodGhpcy5fbWFza1ZhbHVlLmluZGV4T2YoJyonKSA+IDEgJiYgdmFsdWUudG9TdHJpbmcoKS5sZW5ndGggPCB0aGlzLl9tYXNrVmFsdWUuaW5kZXhPZignKicpKSB8fFxyXG4gICAgICAgICh0aGlzLl9tYXNrVmFsdWUuaW5kZXhPZignPycpID4gMSAmJiB2YWx1ZS50b1N0cmluZygpLmxlbmd0aCA8IHRoaXMuX21hc2tWYWx1ZS5pbmRleE9mKCc/JykpIHx8XHJcbiAgICAgICAgdGhpcy5fbWFza1ZhbHVlLmluZGV4T2YoJ3snKSA9PT0gMVxyXG4gICAgICApIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fY3JlYXRlVmFsaWRhdGlvbkVycm9yKHZhbHVlKTtcclxuICAgICAgfVxyXG4gICAgICBpZiAodGhpcy5fbWFza1ZhbHVlLmluZGV4T2YoJyonKSA9PT0gLTEgfHwgdGhpcy5fbWFza1ZhbHVlLmluZGV4T2YoJz8nKSA9PT0gLTEpIHtcclxuICAgICAgICBjb25zdCBsZW5ndGg6IG51bWJlciA9IHRoaXMuX21hc2tTZXJ2aWNlLmRyb3BTcGVjaWFsQ2hhcmFjdGVyc1xyXG4gICAgICAgICAgPyB0aGlzLl9tYXNrVmFsdWUubGVuZ3RoIC0gdGhpcy5fbWFza1NlcnZpY2UuY2hlY2tTcGVjaWFsQ2hhckFtb3VudCh0aGlzLl9tYXNrVmFsdWUpIC0gY291bnRlck9mT3B0XHJcbiAgICAgICAgICA6IHRoaXMuX21hc2tWYWx1ZS5sZW5ndGggLSBjb3VudGVyT2ZPcHQ7XHJcbiAgICAgICAgaWYgKHZhbHVlLnRvU3RyaW5nKCkubGVuZ3RoIDwgbGVuZ3RoKSB7XHJcbiAgICAgICAgICByZXR1cm4gdGhpcy5fY3JlYXRlVmFsaWRhdGlvbkVycm9yKHZhbHVlKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBudWxsO1xyXG4gIH1cclxuICBASG9zdExpc3RlbmVyKCdwYXN0ZScpXHJcbiAgcHVibGljIG9uUGFzdGUoKSB7XHJcbiAgICB0aGlzLl9qdXN0UGFzdGVkID0gdHJ1ZTtcclxuICB9XHJcblxyXG4gIEBIb3N0TGlzdGVuZXIoJ2lucHV0JywgWyckZXZlbnQnXSlcclxuICBwdWJsaWMgb25JbnB1dChlOiBDdXN0b21LZXlib2FyZEV2ZW50KTogdm9pZCB7XHJcbiAgICBjb25zdCBlbDogSFRNTElucHV0RWxlbWVudCA9IGUudGFyZ2V0IGFzIEhUTUxJbnB1dEVsZW1lbnQ7XHJcbiAgICB0aGlzLl9pbnB1dFZhbHVlID0gZWwudmFsdWU7XHJcblxyXG4gICAgdGhpcy5fc2V0TWFzaygpO1xyXG5cclxuICAgIGlmICghdGhpcy5fbWFza1ZhbHVlKSB7XHJcbiAgICAgIHRoaXMub25DaGFuZ2UoZWwudmFsdWUpO1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICBjb25zdCBwb3NpdGlvbjogbnVtYmVyID1cclxuICAgICAgZWwuc2VsZWN0aW9uU3RhcnQgPT09IDFcclxuICAgICAgICA/IChlbC5zZWxlY3Rpb25TdGFydCBhcyBudW1iZXIpICsgdGhpcy5fbWFza1NlcnZpY2UucHJlZml4Lmxlbmd0aFxyXG4gICAgICAgIDogKGVsLnNlbGVjdGlvblN0YXJ0IGFzIG51bWJlcik7XHJcbiAgICBsZXQgY2FyZXRTaGlmdCA9IDA7XHJcbiAgICBsZXQgYmFja3NwYWNlU2hpZnQgPSBmYWxzZTtcclxuICAgIHRoaXMuX21hc2tTZXJ2aWNlLmFwcGx5VmFsdWVDaGFuZ2VzKFxyXG4gICAgICBwb3NpdGlvbixcclxuICAgICAgdGhpcy5fanVzdFBhc3RlZCxcclxuICAgICAgdGhpcy5fY29kZSA9PT0gJ0JhY2tzcGFjZScsXHJcbiAgICAgIChzaGlmdDogbnVtYmVyLCBfYmFja3NwYWNlU2hpZnQ6IGJvb2xlYW4pID0+IHtcclxuICAgICAgICB0aGlzLl9qdXN0UGFzdGVkID0gZmFsc2U7XHJcbiAgICAgICAgY2FyZXRTaGlmdCA9IHNoaWZ0O1xyXG4gICAgICAgIGJhY2tzcGFjZVNoaWZ0ID0gX2JhY2tzcGFjZVNoaWZ0O1xyXG4gICAgICB9XHJcbiAgICApO1xyXG4gICAgLy8gb25seSBzZXQgdGhlIHNlbGVjdGlvbiBpZiB0aGUgZWxlbWVudCBpcyBhY3RpdmVcclxuICAgIGlmICh0aGlzLmRvY3VtZW50LmFjdGl2ZUVsZW1lbnQgIT09IGVsKSB7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIHRoaXMuX3Bvc2l0aW9uID0gdGhpcy5fcG9zaXRpb24gPT09IDEgJiYgdGhpcy5faW5wdXRWYWx1ZS5sZW5ndGggPT09IDEgPyBudWxsIDogdGhpcy5fcG9zaXRpb247XHJcbiAgICBsZXQgcG9zaXRpb25Ub0FwcGx5OiBudW1iZXIgPSB0aGlzLl9wb3NpdGlvblxyXG4gICAgICA/IHRoaXMuX2lucHV0VmFsdWUubGVuZ3RoICsgcG9zaXRpb24gKyBjYXJldFNoaWZ0XHJcbiAgICAgIDogcG9zaXRpb24gKyAodGhpcy5fY29kZSA9PT0gJ0JhY2tzcGFjZScgJiYgIWJhY2tzcGFjZVNoaWZ0ID8gMCA6IGNhcmV0U2hpZnQpO1xyXG4gICAgaWYgKHBvc2l0aW9uVG9BcHBseSA+IHRoaXMuX2dldEFjdHVhbElucHV0TGVuZ3RoKCkpIHtcclxuICAgICAgcG9zaXRpb25Ub0FwcGx5ID0gdGhpcy5fZ2V0QWN0dWFsSW5wdXRMZW5ndGgoKTtcclxuICAgIH1cclxuICAgIGVsLnNldFNlbGVjdGlvblJhbmdlKHBvc2l0aW9uVG9BcHBseSwgcG9zaXRpb25Ub0FwcGx5KTtcclxuICAgIHRoaXMuX3Bvc2l0aW9uID0gbnVsbDtcclxuICB9XHJcblxyXG4gIEBIb3N0TGlzdGVuZXIoJ2JsdXInKVxyXG4gIHB1YmxpYyBvbkJsdXIoKTogdm9pZCB7XHJcbiAgICBpZiAodGhpcy5fbWFza1ZhbHVlKSB7XHJcbiAgICAgIHRoaXMuX21hc2tTZXJ2aWNlLmNsZWFySWZOb3RNYXRjaEZuKCk7XHJcbiAgICB9XHJcbiAgICB0aGlzLm9uVG91Y2goKTtcclxuICB9XHJcblxyXG4gIEBIb3N0TGlzdGVuZXIoJ2NsaWNrJywgWyckZXZlbnQnXSlcclxuICBwdWJsaWMgb25Gb2N1cyhlOiBNb3VzZUV2ZW50IHwgQ3VzdG9tS2V5Ym9hcmRFdmVudCk6IHZvaWQge1xyXG4gICAgaWYgKCF0aGlzLl9tYXNrVmFsdWUpIHtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgY29uc3QgZWw6IEhUTUxJbnB1dEVsZW1lbnQgPSBlLnRhcmdldCBhcyBIVE1MSW5wdXRFbGVtZW50O1xyXG4gICAgY29uc3QgcG9zU3RhcnQgPSAwO1xyXG4gICAgY29uc3QgcG9zRW5kID0gMDtcclxuICAgIGlmIChcclxuICAgICAgZWwgIT09IG51bGwgJiZcclxuICAgICAgZWwuc2VsZWN0aW9uU3RhcnQgIT09IG51bGwgJiZcclxuICAgICAgZWwuc2VsZWN0aW9uU3RhcnQgPT09IGVsLnNlbGVjdGlvbkVuZCAmJlxyXG4gICAgICBlbC5zZWxlY3Rpb25TdGFydCA+IHRoaXMuX21hc2tTZXJ2aWNlLnByZWZpeC5sZW5ndGggJiZcclxuICAgICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lXHJcbiAgICAgIChlIGFzIGFueSkua2V5Q29kZSAhPT0gMzhcclxuICAgICkge1xyXG4gICAgICBpZiAodGhpcy5fbWFza1NlcnZpY2Uuc2hvd01hc2tUeXBlZCkge1xyXG4gICAgICAgIC8vIFdlIGFyZSBzaG93aW5nIHRoZSBtYXNrIGluIHRoZSBpbnB1dFxyXG4gICAgICAgIHRoaXMuX21hc2tTZXJ2aWNlLm1hc2tJc1Nob3duID0gdGhpcy5fbWFza1NlcnZpY2Uuc2hvd01hc2tJbklucHV0KCk7XHJcbiAgICAgICAgaWYgKGVsLnNldFNlbGVjdGlvblJhbmdlICYmIHRoaXMuX21hc2tTZXJ2aWNlLnByZWZpeCArIHRoaXMuX21hc2tTZXJ2aWNlLm1hc2tJc1Nob3duID09PSBlbC52YWx1ZSkge1xyXG4gICAgICAgICAgLy8gdGhlIGlucHV0IE9OTFkgY29udGFpbnMgdGhlIG1hc2ssIHNvIHBvc2l0aW9uIHRoZSBjdXJzb3IgYXQgdGhlIHN0YXJ0XHJcbiAgICAgICAgICBlbC5mb2N1cygpO1xyXG4gICAgICAgICAgZWwuc2V0U2VsZWN0aW9uUmFuZ2UocG9zU3RhcnQsIHBvc0VuZCk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIC8vIHRoZSBpbnB1dCBjb250YWlucyBzb21lIGNoYXJhY3RlcnMgYWxyZWFkeVxyXG4gICAgICAgICAgaWYgKGVsLnNlbGVjdGlvblN0YXJ0ID4gdGhpcy5fbWFza1NlcnZpY2UuYWN0dWFsVmFsdWUubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIC8vIGlmIHRoZSB1c2VyIGNsaWNrZWQgYmV5b25kIG91ciB2YWx1ZSdzIGxlbmd0aCwgcG9zaXRpb24gdGhlIGN1cnNvciBhdCB0aGUgZW5kIG9mIG91ciB2YWx1ZVxyXG4gICAgICAgICAgICBlbC5zZXRTZWxlY3Rpb25SYW5nZSh0aGlzLl9tYXNrU2VydmljZS5hY3R1YWxWYWx1ZS5sZW5ndGgsIHRoaXMuX21hc2tTZXJ2aWNlLmFjdHVhbFZhbHVlLmxlbmd0aCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICBjb25zdCBuZXh0VmFsdWU6IHN0cmluZyB8IG51bGwgPVxyXG4gICAgICAhZWwudmFsdWUgfHwgZWwudmFsdWUgPT09IHRoaXMuX21hc2tTZXJ2aWNlLnByZWZpeFxyXG4gICAgICAgID8gdGhpcy5fbWFza1NlcnZpY2UucHJlZml4ICsgdGhpcy5fbWFza1NlcnZpY2UubWFza0lzU2hvd25cclxuICAgICAgICA6IGVsLnZhbHVlO1xyXG5cclxuICAgIC8qKiBGaXggb2YgY3Vyc29yIHBvc2l0aW9uIGp1bXBpbmcgdG8gZW5kIGluIG1vc3QgYnJvd3NlcnMgbm8gbWF0dGVyIHdoZXJlIGN1cnNvciBpcyBpbnNlcnRlZCBvbkZvY3VzICovXHJcbiAgICBpZiAoZWwudmFsdWUgIT09IG5leHRWYWx1ZSkge1xyXG4gICAgICBlbC52YWx1ZSA9IG5leHRWYWx1ZTtcclxuICAgIH1cclxuXHJcbiAgICAvKiogZml4IG9mIGN1cnNvciBwb3NpdGlvbiB3aXRoIHByZWZpeCB3aGVuIG1vdXNlIGNsaWNrIG9jY3VyICovXHJcbiAgICBpZiAoKChlbC5zZWxlY3Rpb25TdGFydCBhcyBudW1iZXIpIHx8IChlbC5zZWxlY3Rpb25FbmQgYXMgbnVtYmVyKSkgPD0gdGhpcy5fbWFza1NlcnZpY2UucHJlZml4Lmxlbmd0aCkge1xyXG4gICAgICBlbC5zZWxlY3Rpb25TdGFydCA9IHRoaXMuX21hc2tTZXJ2aWNlLnByZWZpeC5sZW5ndGg7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICAvKiogc2VsZWN0IG9ubHkgaW5zZXJ0ZWQgdGV4dCAqL1xyXG4gICAgaWYgKChlbC5zZWxlY3Rpb25FbmQgYXMgbnVtYmVyKSA+IHRoaXMuX2dldEFjdHVhbElucHV0TGVuZ3RoKCkpIHtcclxuICAgICAgZWwuc2VsZWN0aW9uRW5kID0gdGhpcy5fZ2V0QWN0dWFsSW5wdXRMZW5ndGgoKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTogY3ljbG9tYXRpYy1jb21wbGV4aXR5XHJcbiAgQEhvc3RMaXN0ZW5lcigna2V5ZG93bicsIFsnJGV2ZW50J10pXHJcbiAgcHVibGljIG9uS2V5RG93bihlOiBDdXN0b21LZXlib2FyZEV2ZW50KTogdm9pZCB7XHJcbiAgICBpZiAoIXRoaXMuX21hc2tWYWx1ZSkge1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICB0aGlzLl9jb2RlID0gZS5jb2RlID8gZS5jb2RlIDogZS5rZXk7XHJcbiAgICBjb25zdCBlbDogSFRNTElucHV0RWxlbWVudCA9IGUudGFyZ2V0IGFzIEhUTUxJbnB1dEVsZW1lbnQ7XHJcbiAgICB0aGlzLl9pbnB1dFZhbHVlID0gZWwudmFsdWU7XHJcblxyXG4gICAgdGhpcy5fc2V0TWFzaygpO1xyXG5cclxuICAgIGlmIChlLmtleUNvZGUgPT09IDM4KSB7XHJcbiAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgIH1cclxuICAgIGlmIChlLmtleUNvZGUgPT09IDM3IHx8IGUua2V5Q29kZSA9PT0gOCB8fCBlLmtleUNvZGUgPT09IDQ2KSB7XHJcbiAgICAgIGlmIChlLmtleUNvZGUgPT09IDggJiYgZWwudmFsdWUubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgZWwuc2VsZWN0aW9uU3RhcnQgPSBlbC5zZWxlY3Rpb25FbmQ7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKGUua2V5Q29kZSA9PT0gOCAmJiAoZWwuc2VsZWN0aW9uU3RhcnQgYXMgbnVtYmVyKSAhPT0gMCkge1xyXG4gICAgICAgIC8vIElmIHNwZWNpYWxDaGFycyBpcyBmYWxzZSwgKHNob3VsZG4ndCBldmVyIGhhcHBlbikgdGhlbiBzZXQgdG8gdGhlIGRlZmF1bHRzXHJcbiAgICAgICAgdGhpcy5zcGVjaWFsQ2hhcmFjdGVycyA9IHRoaXMuc3BlY2lhbENoYXJhY3RlcnM/Lmxlbmd0aFxyXG4gICAgICAgICAgPyB0aGlzLnNwZWNpYWxDaGFyYWN0ZXJzXHJcbiAgICAgICAgICA6IHRoaXMuX2NvbmZpZy5zcGVjaWFsQ2hhcmFjdGVycztcclxuICAgICAgICBpZiAodGhpcy5wcmVmaXgubGVuZ3RoID4gMSAmJiAoZWwuc2VsZWN0aW9uU3RhcnQgYXMgbnVtYmVyKSA8PSB0aGlzLnByZWZpeC5sZW5ndGgpIHtcclxuICAgICAgICAgIGVsLnNldFNlbGVjdGlvblJhbmdlKHRoaXMucHJlZml4Lmxlbmd0aCwgdGhpcy5wcmVmaXgubGVuZ3RoKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgaWYgKHRoaXMuX2lucHV0VmFsdWUubGVuZ3RoICE9PSAoZWwuc2VsZWN0aW9uU3RhcnQgYXMgbnVtYmVyKSAmJiAoZWwuc2VsZWN0aW9uU3RhcnQgYXMgbnVtYmVyKSAhPT0gMSkge1xyXG4gICAgICAgICAgICB3aGlsZSAoXHJcbiAgICAgICAgICAgICAgdGhpcy5zcGVjaWFsQ2hhcmFjdGVycy5pbmNsdWRlcyh0aGlzLl9pbnB1dFZhbHVlWyhlbC5zZWxlY3Rpb25TdGFydCBhcyBudW1iZXIpIC0gMV0udG9TdHJpbmcoKSkgJiZcclxuICAgICAgICAgICAgICAoKHRoaXMucHJlZml4Lmxlbmd0aCA+PSAxICYmIChlbC5zZWxlY3Rpb25TdGFydCBhcyBudW1iZXIpID4gdGhpcy5wcmVmaXgubGVuZ3RoKSB8fFxyXG4gICAgICAgICAgICAgICAgdGhpcy5wcmVmaXgubGVuZ3RoID09PSAwKVxyXG4gICAgICAgICAgICApIHtcclxuICAgICAgICAgICAgICBlbC5zZXRTZWxlY3Rpb25SYW5nZSgoZWwuc2VsZWN0aW9uU3RhcnQgYXMgbnVtYmVyKSAtIDEsIChlbC5zZWxlY3Rpb25TdGFydCBhcyBudW1iZXIpIC0gMSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICAgIHRoaXMuc3VmZml4Q2hlY2tPblByZXNzRGVsZXRlKGUua2V5Q29kZSwgZWwpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICB0aGlzLnN1ZmZpeENoZWNrT25QcmVzc0RlbGV0ZShlLmtleUNvZGUsIGVsKTtcclxuICAgICAgaWYgKFxyXG4gICAgICAgIHRoaXMuX21hc2tTZXJ2aWNlLnByZWZpeC5sZW5ndGggJiZcclxuICAgICAgICAoZWwuc2VsZWN0aW9uU3RhcnQgYXMgbnVtYmVyKSA8PSB0aGlzLl9tYXNrU2VydmljZS5wcmVmaXgubGVuZ3RoICYmXHJcbiAgICAgICAgKGVsLnNlbGVjdGlvbkVuZCBhcyBudW1iZXIpIDw9IHRoaXMuX21hc2tTZXJ2aWNlLnByZWZpeC5sZW5ndGhcclxuICAgICAgKSB7XHJcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICB9XHJcbiAgICAgIGNvbnN0IGN1cnNvclN0YXJ0OiBudW1iZXIgfCBudWxsID0gZWwuc2VsZWN0aW9uU3RhcnQ7XHJcbiAgICAgIC8vIHRoaXMub25Gb2N1cyhlKTtcclxuICAgICAgaWYgKFxyXG4gICAgICAgIGUua2V5Q29kZSA9PT0gOCAmJlxyXG4gICAgICAgICFlbC5yZWFkT25seSAmJlxyXG4gICAgICAgIGN1cnNvclN0YXJ0ID09PSAwICYmXHJcbiAgICAgICAgZWwuc2VsZWN0aW9uRW5kID09PSBlbC52YWx1ZS5sZW5ndGggJiZcclxuICAgICAgICBlbC52YWx1ZS5sZW5ndGggIT09IDBcclxuICAgICAgKSB7XHJcbiAgICAgICAgdGhpcy5fcG9zaXRpb24gPSB0aGlzLl9tYXNrU2VydmljZS5wcmVmaXggPyB0aGlzLl9tYXNrU2VydmljZS5wcmVmaXgubGVuZ3RoIDogMDtcclxuICAgICAgICB0aGlzLl9tYXNrU2VydmljZS5hcHBseU1hc2sodGhpcy5fbWFza1NlcnZpY2UucHJlZml4LCB0aGlzLl9tYXNrU2VydmljZS5tYXNrRXhwcmVzc2lvbiwgdGhpcy5fcG9zaXRpb24pO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICBpZiAoXHJcbiAgICAgICEhdGhpcy5zdWZmaXggJiZcclxuICAgICAgdGhpcy5zdWZmaXgubGVuZ3RoID4gMSAmJlxyXG4gICAgICB0aGlzLl9pbnB1dFZhbHVlLmxlbmd0aCAtIHRoaXMuc3VmZml4Lmxlbmd0aCA8IChlbC5zZWxlY3Rpb25TdGFydCBhcyBudW1iZXIpXHJcbiAgICApIHtcclxuICAgICAgZWwuc2V0U2VsZWN0aW9uUmFuZ2UodGhpcy5faW5wdXRWYWx1ZS5sZW5ndGggLSB0aGlzLnN1ZmZpeC5sZW5ndGgsIHRoaXMuX2lucHV0VmFsdWUubGVuZ3RoKTtcclxuICAgIH0gZWxzZSBpZiAoXHJcbiAgICAgIChlLmtleUNvZGUgPT09IDY1ICYmIGUuY3RybEtleSA9PT0gdHJ1ZSkgfHwgLy8gQ3RybCsgQVxyXG4gICAgICAoZS5rZXlDb2RlID09PSA2NSAmJiBlLm1ldGFLZXkgPT09IHRydWUpIC8vIENtZCArIEEgKE1hYylcclxuICAgICkge1xyXG4gICAgICBlbC5zZXRTZWxlY3Rpb25SYW5nZSgwLCB0aGlzLl9nZXRBY3R1YWxJbnB1dExlbmd0aCgpKTtcclxuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgfVxyXG4gICAgdGhpcy5fbWFza1NlcnZpY2Uuc2VsU3RhcnQgPSBlbC5zZWxlY3Rpb25TdGFydDtcclxuICAgIHRoaXMuX21hc2tTZXJ2aWNlLnNlbEVuZCA9IGVsLnNlbGVjdGlvbkVuZDtcclxuICB9XHJcblxyXG4gIC8qKiBJdCB3cml0ZXMgdGhlIHZhbHVlIGluIHRoZSBpbnB1dCAqL1xyXG4gIHB1YmxpYyBhc3luYyB3cml0ZVZhbHVlKGlucHV0VmFsdWU6IHN0cmluZyB8IG51bWJlciB8IHsgdmFsdWU6IHN0cmluZyB8IG51bWJlcjsgZGlzYWJsZT86IGJvb2xlYW4gfSk6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgaWYgKHR5cGVvZiBpbnB1dFZhbHVlID09PSAnb2JqZWN0JyAmJiBpbnB1dFZhbHVlICE9PSBudWxsICYmICd2YWx1ZScgaW4gaW5wdXRWYWx1ZSkge1xyXG4gICAgICBpZiAoJ2Rpc2FibGUnIGluIGlucHV0VmFsdWUpIHtcclxuICAgICAgICB0aGlzLnNldERpc2FibGVkU3RhdGUoQm9vbGVhbihpbnB1dFZhbHVlLmRpc2FibGUpKTtcclxuICAgICAgfVxyXG4gICAgICBpbnB1dFZhbHVlID0gaW5wdXRWYWx1ZS52YWx1ZTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoaW5wdXRWYWx1ZSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIGlucHV0VmFsdWUgPSAnJztcclxuICAgIH1cclxuICAgIGlmICh0eXBlb2YgaW5wdXRWYWx1ZSA9PT0gJ251bWJlcicpIHtcclxuICAgICAgaW5wdXRWYWx1ZSA9IFN0cmluZyhpbnB1dFZhbHVlKTtcclxuICAgICAgaW5wdXRWYWx1ZSA9IHRoaXMuZGVjaW1hbE1hcmtlciAhPT0gJy4nID8gaW5wdXRWYWx1ZS5yZXBsYWNlKCcuJywgdGhpcy5kZWNpbWFsTWFya2VyKSA6IGlucHV0VmFsdWU7XHJcbiAgICAgIHRoaXMuX21hc2tTZXJ2aWNlLmlzTnVtYmVyVmFsdWUgPSB0cnVlO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuX2lucHV0VmFsdWUgPSBpbnB1dFZhbHVlO1xyXG4gICAgdGhpcy5fc2V0TWFzaygpO1xyXG5cclxuICAgIGlmIChcclxuICAgICAgKGlucHV0VmFsdWUgJiYgdGhpcy5fbWFza1NlcnZpY2UubWFza0V4cHJlc3Npb24pIHx8XHJcbiAgICAgICh0aGlzLl9tYXNrU2VydmljZS5tYXNrRXhwcmVzc2lvbiAmJiAodGhpcy5fbWFza1NlcnZpY2UucHJlZml4IHx8IHRoaXMuX21hc2tTZXJ2aWNlLnNob3dNYXNrVHlwZWQpKVxyXG4gICAgKSB7XHJcbiAgICAgIC8vIExldCB0aGUgc2VydmljZSB3ZSBrbm93IHdlIGFyZSB3cml0aW5nIHZhbHVlIHNvIHRoYXQgdHJpZ2dlcmluZyBvbkNoYW5nZSBmdW5jdGlvbiB3b250IGhhcHBlbiBkdXJpbmcgYXBwbHlNYXNrXHJcbiAgICAgIHRoaXMuX21hc2tTZXJ2aWNlLndyaXRpbmdWYWx1ZSA9IHRydWU7XHJcbiAgICAgIHRoaXMuX21hc2tTZXJ2aWNlLmZvcm1FbGVtZW50UHJvcGVydHkgPSBbXHJcbiAgICAgICAgJ3ZhbHVlJyxcclxuICAgICAgICB0aGlzLl9tYXNrU2VydmljZS5hcHBseU1hc2soaW5wdXRWYWx1ZSwgdGhpcy5fbWFza1NlcnZpY2UubWFza0V4cHJlc3Npb24pLFxyXG4gICAgICBdO1xyXG4gICAgICAvLyBMZXQgdGhlIHNlcnZpY2Uga25vdyB3ZSd2ZSBmaW5pc2hlZCB3cml0aW5nIHZhbHVlXHJcbiAgICAgIHRoaXMuX21hc2tTZXJ2aWNlLndyaXRpbmdWYWx1ZSA9IGZhbHNlO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdGhpcy5fbWFza1NlcnZpY2UuZm9ybUVsZW1lbnRQcm9wZXJ0eSA9IFsndmFsdWUnLCBpbnB1dFZhbHVlXTtcclxuICAgIH1cclxuICAgIHRoaXMuX2lucHV0VmFsdWUgPSBpbnB1dFZhbHVlO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIHJlZ2lzdGVyT25DaGFuZ2UoZm46IGFueSk6IHZvaWQge1xyXG4gICAgdGhpcy5vbkNoYW5nZSA9IGZuO1xyXG4gICAgdGhpcy5fbWFza1NlcnZpY2Uub25DaGFuZ2UgPSB0aGlzLm9uQ2hhbmdlO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIHJlZ2lzdGVyT25Ub3VjaGVkKGZuOiBhbnkpOiB2b2lkIHtcclxuICAgIHRoaXMub25Ub3VjaCA9IGZuO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIHN1ZmZpeENoZWNrT25QcmVzc0RlbGV0ZShrZXlDb2RlOiBudW1iZXIsIGVsOiBIVE1MSW5wdXRFbGVtZW50KTogdm9pZCB7XHJcbiAgICBpZiAoa2V5Q29kZSA9PT0gNDYgJiYgdGhpcy5zdWZmaXgubGVuZ3RoID4gMCkge1xyXG4gICAgICBpZiAodGhpcy5faW5wdXRWYWx1ZS5sZW5ndGggLSB0aGlzLnN1ZmZpeC5sZW5ndGggPD0gKGVsLnNlbGVjdGlvblN0YXJ0IGFzIG51bWJlcikpIHtcclxuICAgICAgICBlbC5zZXRTZWxlY3Rpb25SYW5nZSh0aGlzLl9pbnB1dFZhbHVlLmxlbmd0aCAtIHRoaXMuc3VmZml4Lmxlbmd0aCwgdGhpcy5faW5wdXRWYWx1ZS5sZW5ndGgpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICBpZiAoa2V5Q29kZSA9PT0gOCkge1xyXG4gICAgICBpZiAodGhpcy5zdWZmaXgubGVuZ3RoID4gMSAmJiB0aGlzLl9pbnB1dFZhbHVlLmxlbmd0aCAtIHRoaXMuc3VmZml4Lmxlbmd0aCA8IChlbC5zZWxlY3Rpb25TdGFydCBhcyBudW1iZXIpKSB7XHJcbiAgICAgICAgZWwuc2V0U2VsZWN0aW9uUmFuZ2UodGhpcy5faW5wdXRWYWx1ZS5sZW5ndGggLSB0aGlzLnN1ZmZpeC5sZW5ndGgsIHRoaXMuX2lucHV0VmFsdWUubGVuZ3RoKTtcclxuICAgICAgfVxyXG4gICAgICBpZiAodGhpcy5zdWZmaXgubGVuZ3RoID09PSAxICYmIHRoaXMuX2lucHV0VmFsdWUubGVuZ3RoID09PSAoZWwuc2VsZWN0aW9uU3RhcnQgYXMgbnVtYmVyKSkge1xyXG4gICAgICAgIGVsLnNldFNlbGVjdGlvblJhbmdlKChlbC5zZWxlY3Rpb25TdGFydCBhcyBudW1iZXIpIC0gMSwgKGVsLnNlbGVjdGlvblN0YXJ0IGFzIG51bWJlcikgLSAxKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqIEl0IGRpc2FibGVzIHRoZSBpbnB1dCBlbGVtZW50ICovXHJcbiAgcHVibGljIHNldERpc2FibGVkU3RhdGUoaXNEaXNhYmxlZDogYm9vbGVhbik6IHZvaWQge1xyXG4gICAgdGhpcy5fbWFza1NlcnZpY2UuZm9ybUVsZW1lbnRQcm9wZXJ0eSA9IFsnZGlzYWJsZWQnLCBpc0Rpc2FibGVkXTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgX3JlcGVhdFBhdHRlcm5TeW1ib2xzKG1hc2tFeHA6IHN0cmluZyk6IHN0cmluZyB7XHJcbiAgICByZXR1cm4gKFxyXG4gICAgICAobWFza0V4cC5tYXRjaCgve1swLTldK30vKSAmJlxyXG4gICAgICAgIG1hc2tFeHAuc3BsaXQoJycpLnJlZHVjZSgoYWNjdW06IHN0cmluZywgY3VycnZhbDogc3RyaW5nLCBpbmRleDogbnVtYmVyKTogc3RyaW5nID0+IHtcclxuICAgICAgICAgIHRoaXMuX3N0YXJ0ID0gY3VycnZhbCA9PT0gJ3snID8gaW5kZXggOiB0aGlzLl9zdGFydDtcclxuXHJcbiAgICAgICAgICBpZiAoY3VycnZhbCAhPT0gJ30nKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9tYXNrU2VydmljZS5fZmluZFNwZWNpYWxDaGFyKGN1cnJ2YWwpID8gYWNjdW0gKyBjdXJydmFsIDogYWNjdW07XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICB0aGlzLl9lbmQgPSBpbmRleDtcclxuICAgICAgICAgIGNvbnN0IHJlcGVhdE51bWJlcjogbnVtYmVyID0gTnVtYmVyKG1hc2tFeHAuc2xpY2UodGhpcy5fc3RhcnQgKyAxLCB0aGlzLl9lbmQpKTtcclxuICAgICAgICAgIGNvbnN0IHJlcGxhY2VXaXRoOiBzdHJpbmcgPSBuZXcgQXJyYXkocmVwZWF0TnVtYmVyICsgMSkuam9pbihtYXNrRXhwW3RoaXMuX3N0YXJ0IC0gMV0pO1xyXG4gICAgICAgICAgcmV0dXJuIGFjY3VtICsgcmVwbGFjZVdpdGg7XHJcbiAgICAgICAgfSwgJycpKSB8fFxyXG4gICAgICBtYXNrRXhwXHJcbiAgICApO1xyXG4gIH1cclxuXHJcbiAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOm5vLWFueVxyXG4gIHByaXZhdGUgX2FwcGx5TWFzaygpOiBhbnkge1xyXG4gICAgdGhpcy5fbWFza1NlcnZpY2UubWFza0V4cHJlc3Npb24gPSB0aGlzLl9yZXBlYXRQYXR0ZXJuU3ltYm9scyh0aGlzLl9tYXNrVmFsdWUgfHwgJycpO1xyXG4gICAgdGhpcy5fbWFza1NlcnZpY2UuZm9ybUVsZW1lbnRQcm9wZXJ0eSA9IFtcclxuICAgICAgJ3ZhbHVlJyxcclxuICAgICAgdGhpcy5fbWFza1NlcnZpY2UuYXBwbHlNYXNrKHRoaXMuX2lucHV0VmFsdWUsIHRoaXMuX21hc2tTZXJ2aWNlLm1hc2tFeHByZXNzaW9uKSxcclxuICAgIF07XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIF92YWxpZGF0ZVRpbWUodmFsdWU6IHN0cmluZyk6IFZhbGlkYXRpb25FcnJvcnMgfCBudWxsIHtcclxuICAgIGNvbnN0IHJvd01hc2tMZW46IG51bWJlciA9IHRoaXMuX21hc2tWYWx1ZS5zcGxpdCgnJykuZmlsdGVyKChzOiBzdHJpbmcpID0+IHMgIT09ICc6JykubGVuZ3RoO1xyXG4gICAgaWYgKCF2YWx1ZSkge1xyXG4gICAgICByZXR1cm4gbnVsbDsgLy8gRG9uJ3QgdmFsaWRhdGUgZW1wdHkgdmFsdWVzIHRvIGFsbG93IGZvciBvcHRpb25hbCBmb3JtIGNvbnRyb2xcclxuICAgIH1cclxuXHJcbiAgICBpZiAoKCt2YWx1ZVt2YWx1ZS5sZW5ndGggLSAxXSA9PT0gMCAmJiB2YWx1ZS5sZW5ndGggPCByb3dNYXNrTGVuKSB8fCB2YWx1ZS5sZW5ndGggPD0gcm93TWFza0xlbiAtIDIpIHtcclxuICAgICAgcmV0dXJuIHRoaXMuX2NyZWF0ZVZhbGlkYXRpb25FcnJvcih2YWx1ZSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIG51bGw7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIF9nZXRBY3R1YWxJbnB1dExlbmd0aCgpIHtcclxuICAgIHJldHVybiAoXHJcbiAgICAgIHRoaXMuX21hc2tTZXJ2aWNlLmFjdHVhbFZhbHVlLmxlbmd0aCB8fCB0aGlzLl9tYXNrU2VydmljZS5hY3R1YWxWYWx1ZS5sZW5ndGggKyB0aGlzLl9tYXNrU2VydmljZS5wcmVmaXgubGVuZ3RoXHJcbiAgICApO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBfY3JlYXRlVmFsaWRhdGlvbkVycm9yKGFjdHVhbFZhbHVlOiBzdHJpbmcpOiBWYWxpZGF0aW9uRXJyb3JzIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgIG1hc2s6IHtcclxuICAgICAgICByZXF1aXJlZE1hc2s6IHRoaXMuX21hc2tWYWx1ZSxcclxuICAgICAgICBhY3R1YWxWYWx1ZSxcclxuICAgICAgfSxcclxuICAgIH07XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIF9zZXRNYXNrKCkge1xyXG4gICAgaWYgKHRoaXMuX21hc2tFeHByZXNzaW9uQXJyYXkubGVuZ3RoID4gMCkge1xyXG4gICAgICB0aGlzLl9tYXNrRXhwcmVzc2lvbkFycmF5LnNvbWUoKG1hc2spID0+IHtcclxuICAgICAgICBjb25zdCB0ZXN0ID0gdGhpcy5faW5wdXRWYWx1ZSAmJlxyXG4gICAgICAgICAgdGhpcy5fbWFza1NlcnZpY2UucmVtb3ZlTWFzayh0aGlzLl9pbnB1dFZhbHVlKT8ubGVuZ3RoIDw9IHRoaXMuX21hc2tTZXJ2aWNlLnJlbW92ZU1hc2sobWFzayk/Lmxlbmd0aDtcclxuICAgICAgICBpZiAodGhpcy5faW5wdXRWYWx1ZSAmJiB0ZXN0KSB7XHJcbiAgICAgICAgICB0aGlzLl9tYXNrVmFsdWUgPSBtYXNrO1xyXG4gICAgICAgICAgdGhpcy5tYXNrRXhwcmVzc2lvbiA9IG1hc2s7XHJcbiAgICAgICAgICB0aGlzLl9tYXNrU2VydmljZS5tYXNrRXhwcmVzc2lvbiA9IG1hc2s7XHJcbiAgICAgICAgICByZXR1cm4gdGVzdDtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgdGhpcy5fbWFza1ZhbHVlID0gdGhpcy5fbWFza0V4cHJlc3Npb25BcnJheVt0aGlzLl9tYXNrRXhwcmVzc2lvbkFycmF5Lmxlbmd0aCAtIDFdO1xyXG4gICAgICAgICAgdGhpcy5tYXNrRXhwcmVzc2lvbiA9IHRoaXMuX21hc2tFeHByZXNzaW9uQXJyYXlbdGhpcy5fbWFza0V4cHJlc3Npb25BcnJheS5sZW5ndGggLSAxXTtcclxuICAgICAgICAgIHRoaXMuX21hc2tTZXJ2aWNlLm1hc2tFeHByZXNzaW9uID0gdGhpcy5fbWFza0V4cHJlc3Npb25BcnJheVt0aGlzLl9tYXNrRXhwcmVzc2lvbkFycmF5Lmxlbmd0aCAtIDFdO1xyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcbiAgICB9XHJcbiAgfVxyXG59XHJcbiJdfQ==