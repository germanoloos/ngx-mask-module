import { Inject, Injectable } from '@angular/core';
import { config } from './config';
export class MaskApplierService {
    constructor(_config) {
        this._config = _config;
        this.maskExpression = '';
        this.actualValue = '';
        this.shownMaskExpression = '';
        this._formatWithSeparators = (str, thousandSeparatorChar, decimalChar, precision) => {
            const x = str.split(decimalChar);
            const decimals = x.length > 1 ? `${decimalChar}${x[1]}` : '';
            let res = x[0];
            const separatorLimit = this.separatorLimit.replace(/\s/g, '');
            if (separatorLimit && +separatorLimit) {
                if (res[0] === '-') {
                    res = `-${res.slice(1, res.length).slice(0, separatorLimit.length)}`;
                }
                else {
                    res = res.slice(0, separatorLimit.length);
                }
            }
            const rgx = /(\d+)(\d{3})/;
            while (thousandSeparatorChar && rgx.test(res)) {
                res = res.replace(rgx, '$1' + thousandSeparatorChar + '$2');
            }
            if (precision === undefined) {
                return res + decimals;
            }
            else if (precision === 0) {
                return res;
            }
            return res + decimals.substr(0, precision + 1);
        };
        this.percentage = (str) => {
            return Number(str) >= 0 && Number(str) <= 100;
        };
        this.getPrecision = (maskExpression) => {
            const x = maskExpression.split('.');
            if (x.length > 1) {
                return Number(x[x.length - 1]);
            }
            return Infinity;
        };
        this.checkAndRemoveSuffix = (inputValue) => {
            var _a, _b, _c;
            for (let i = ((_a = this.suffix) === null || _a === void 0 ? void 0 : _a.length) - 1; i >= 0; i--) {
                const substr = this.suffix.substr(i, (_b = this.suffix) === null || _b === void 0 ? void 0 : _b.length);
                if (inputValue.includes(substr) &&
                    (i - 1 < 0 || !inputValue.includes(this.suffix.substr(i - 1, (_c = this.suffix) === null || _c === void 0 ? void 0 : _c.length)))) {
                    return inputValue.replace(substr, '');
                }
            }
            return inputValue;
        };
        this.checkInputPrecision = (inputValue, precision, decimalMarker) => {
            if (precision < Infinity) {
                const precisionRegEx = new RegExp(this._charToRegExpExpression(decimalMarker) + `\\d{${precision}}.*$`);
                const precisionMatch = inputValue.match(precisionRegEx);
                if (precisionMatch && precisionMatch[0].length - 1 > precision) {
                    const diff = precisionMatch[0].length - 1 - precision;
                    inputValue = inputValue.substring(0, inputValue.length - diff);
                }
                if (precision === 0 && inputValue.endsWith(decimalMarker)) {
                    inputValue = inputValue.substring(0, inputValue.length - 1);
                }
            }
            return inputValue;
        };
        this._shift = new Set();
        this.clearIfNotMatch = this._config.clearIfNotMatch;
        this.dropSpecialCharacters = this._config.dropSpecialCharacters;
        this.maskSpecialCharacters = this._config.specialCharacters;
        this.maskAvailablePatterns = this._config.patterns;
        this.prefix = this._config.prefix;
        this.suffix = this._config.suffix;
        this.thousandSeparator = this._config.thousandSeparator;
        this.decimalMarker = this._config.decimalMarker;
        this.hiddenInput = this._config.hiddenInput;
        this.showMaskTyped = this._config.showMaskTyped;
        this.placeHolderCharacter = this._config.placeHolderCharacter;
        this.validation = this._config.validation;
        this.separatorLimit = this._config.separatorLimit;
        this.allowNegativeNumbers = this._config.allowNegativeNumbers;
        this.leadZeroDateTime = this._config.leadZeroDateTime;
    }
    applyMaskWithPattern(inputValue, maskAndPattern) {
        const [mask, customPattern] = maskAndPattern;
        this.customPattern = customPattern;
        return this.applyMask(inputValue, mask);
    }
    applyMask(inputValue, maskExpression, position = 0, justPasted = false, backspaced = false, cb = () => { }) {
        if (inputValue === undefined || inputValue === null || maskExpression === undefined) {
            return '';
        }
        let cursor = 0;
        let result = '';
        let multi = false;
        let backspaceShift = false;
        let shift = 1;
        let stepBack = false;
        if (inputValue.slice(0, this.prefix.length) === this.prefix) {
            inputValue = inputValue.slice(this.prefix.length, inputValue.length);
        }
        if (!!this.suffix && (inputValue === null || inputValue === void 0 ? void 0 : inputValue.length) > 0) {
            inputValue = this.checkAndRemoveSuffix(inputValue);
        }
        const inputArray = inputValue.toString().split('');
        if (maskExpression === 'IP') {
            this.ipError = !!(inputArray.filter((i) => i === '.').length < 3 && inputArray.length < 7);
            maskExpression = '099.099.099.099';
        }
        const arr = [];
        for (let i = 0; i < inputValue.length; i++) {
            if (inputValue[i].match('\\d')) {
                arr.push(inputValue[i]);
            }
        }
        if (maskExpression === 'CPF_CNPJ') {
            this.cpfCnpjError = !!(arr.length !== 11 && arr.length !== 14);
            if (arr.length > 11) {
                maskExpression = '00.000.000/0000-00';
            }
            else {
                maskExpression = '000.000.000-00';
            }
        }
        if (maskExpression.startsWith('percent')) {
            if (inputValue.match('[a-z]|[A-Z]') || inputValue.match(/[-!$%^&*()_+|~=`{}\[\]:";'<>?,\/.]/)) {
                inputValue = this._stripToDecimal(inputValue);
                const precision = this.getPrecision(maskExpression);
                inputValue = this.checkInputPrecision(inputValue, precision, this.decimalMarker);
            }
            if (inputValue.indexOf('.') > 0 && !this.percentage(inputValue.substring(0, inputValue.indexOf('.')))) {
                const base = inputValue.substring(0, inputValue.indexOf('.') - 1);
                inputValue = `${base}${inputValue.substring(inputValue.indexOf('.'), inputValue.length)}`;
            }
            if (this.percentage(inputValue)) {
                result = inputValue;
            }
            else {
                result = inputValue.substring(0, inputValue.length - 1);
            }
        }
        else if (maskExpression.startsWith('separator')) {
            if (inputValue.match('[wа-яА-Я]') ||
                inputValue.match('[ЁёА-я]') ||
                inputValue.match('[a-z]|[A-Z]') ||
                inputValue.match(/[-@#!$%\\^&*()_£¬'+|~=`{}\[\]:";<>.?\/]/) ||
                inputValue.match('[^A-Za-z0-9,]')) {
                inputValue = this._stripToDecimal(inputValue);
            }
            inputValue =
                inputValue.length > 1 && inputValue[0] === '0' && inputValue[1] !== this.decimalMarker
                    ? inputValue.slice(1, inputValue.length)
                    : inputValue;
            // TODO: we had different rexexps here for the different cases... but tests dont seam to bother - check this
            //  separator: no COMMA, dot-sep: no SPACE, COMMA OK, comma-sep: no SPACE, COMMA OK
            const thousandSeperatorCharEscaped = this._charToRegExpExpression(this.thousandSeparator);
            const decimalMarkerEscaped = this._charToRegExpExpression(this.decimalMarker);
            const invalidChars = '@#!$%^&*()_+|~=`{}\\[\\]:\\s,\\.";<>?\\/'
                .replace(thousandSeperatorCharEscaped, '')
                .replace(decimalMarkerEscaped, '');
            const invalidCharRegexp = new RegExp('[' + invalidChars + ']');
            if (inputValue.match(invalidCharRegexp)) {
                inputValue = inputValue.substring(0, inputValue.length - 1);
            }
            const precision = this.getPrecision(maskExpression);
            inputValue = this.checkInputPrecision(inputValue, precision, this.decimalMarker);
            const strForSep = inputValue.replace(new RegExp(thousandSeperatorCharEscaped, 'g'), '');
            result = this._formatWithSeparators(strForSep, this.thousandSeparator, this.decimalMarker, precision);
            const commaShift = result.indexOf(',') - inputValue.indexOf(',');
            const shiftStep = result.length - inputValue.length;
            if (shiftStep > 0 && result[position] !== ',') {
                backspaceShift = true;
                let _shift = 0;
                do {
                    this._shift.add(position + _shift);
                    _shift++;
                } while (_shift < shiftStep);
            }
            else if ((commaShift !== 0 && position > 0 && !(result.indexOf(',') >= position && position > 3)) ||
                (!(result.indexOf('.') >= position && position > 3) && shiftStep <= 0)) {
                this._shift.clear();
                backspaceShift = true;
                shift = shiftStep;
                position += shiftStep;
                this._shift.add(position);
            }
            else {
                this._shift.clear();
            }
        }
        else {
            for (
            // tslint:disable-next-line
            let i = 0, inputSymbol = inputArray[0]; i < inputArray.length; i++, inputSymbol = inputArray[i]) {
                if (cursor === maskExpression.length) {
                    break;
                }
                if (this._checkSymbolMask(inputSymbol, maskExpression[cursor]) && maskExpression[cursor + 1] === '?') {
                    result += inputSymbol;
                    cursor += 2;
                }
                else if (maskExpression[cursor + 1] === '*' &&
                    multi &&
                    this._checkSymbolMask(inputSymbol, maskExpression[cursor + 2])) {
                    result += inputSymbol;
                    cursor += 3;
                    multi = false;
                }
                else if (this._checkSymbolMask(inputSymbol, maskExpression[cursor]) && maskExpression[cursor + 1] === '*') {
                    result += inputSymbol;
                    multi = true;
                }
                else if (maskExpression[cursor + 1] === '?' &&
                    this._checkSymbolMask(inputSymbol, maskExpression[cursor + 2])) {
                    result += inputSymbol;
                    cursor += 3;
                }
                else if (this._checkSymbolMask(inputSymbol, maskExpression[cursor])) {
                    if (maskExpression[cursor] === 'H') {
                        if (Number(inputSymbol) > 2) {
                            cursor += 1;
                            this._shiftStep(maskExpression, cursor, inputArray.length);
                            i--;
                            if (this.leadZeroDateTime) {
                                result += '0';
                            }
                            continue;
                        }
                    }
                    if (maskExpression[cursor] === 'h') {
                        if (result === '2' && Number(inputSymbol) > 3) {
                            cursor += 1;
                            i--;
                            continue;
                        }
                    }
                    if (maskExpression[cursor] === 'm') {
                        if (Number(inputSymbol) > 5) {
                            cursor += 1;
                            this._shiftStep(maskExpression, cursor, inputArray.length);
                            i--;
                            if (this.leadZeroDateTime) {
                                result += '0';
                            }
                            continue;
                        }
                    }
                    if (maskExpression[cursor] === 's') {
                        if (Number(inputSymbol) > 5) {
                            cursor += 1;
                            this._shiftStep(maskExpression, cursor, inputArray.length);
                            i--;
                            if (this.leadZeroDateTime) {
                                result += '0';
                            }
                            continue;
                        }
                    }
                    const daysCount = 31;
                    if (maskExpression[cursor] === 'd') {
                        if ((Number(inputSymbol) > 3 && this.leadZeroDateTime) ||
                            Number(inputValue.slice(cursor, cursor + 2)) > daysCount ||
                            inputValue[cursor + 1] === '/') {
                            cursor += 1;
                            this._shiftStep(maskExpression, cursor, inputArray.length);
                            i--;
                            if (this.leadZeroDateTime) {
                                result += '0';
                            }
                            continue;
                        }
                    }
                    if (maskExpression[cursor] === 'M') {
                        const monthsCount = 12;
                        // mask without day
                        const withoutDays = cursor === 0 &&
                            (Number(inputSymbol) > 2 ||
                                Number(inputValue.slice(cursor, cursor + 2)) > monthsCount ||
                                inputValue[cursor + 1] === '/');
                        // day<10 && month<12 for input
                        const day1monthInput = inputValue.slice(cursor - 3, cursor - 1).includes('/') &&
                            ((inputValue[cursor - 2] === '/' &&
                                Number(inputValue.slice(cursor - 1, cursor + 1)) > monthsCount &&
                                inputValue[cursor] !== '/') ||
                                inputValue[cursor] === '/' ||
                                (inputValue[cursor - 3] === '/' &&
                                    Number(inputValue.slice(cursor - 2, cursor)) > monthsCount &&
                                    inputValue[cursor - 1] !== '/') ||
                                inputValue[cursor - 1] === '/');
                        // 10<day<31 && month<12 for input
                        const day2monthInput = Number(inputValue.slice(cursor - 3, cursor - 1)) <= daysCount &&
                            !inputValue.slice(cursor - 3, cursor - 1).includes('/') &&
                            inputValue[cursor - 1] === '/' &&
                            (Number(inputValue.slice(cursor, cursor + 2)) > monthsCount || inputValue[cursor + 1] === '/');
                        // day<10 && month<12 for paste whole data
                        const day1monthPaste = Number(inputValue.slice(cursor - 3, cursor - 1)) > daysCount &&
                            !inputValue.slice(cursor - 3, cursor - 1).includes('/') &&
                            !inputValue.slice(cursor - 2, cursor).includes('/') &&
                            Number(inputValue.slice(cursor - 2, cursor)) > monthsCount;
                        // 10<day<31 && month<12 for paste whole data
                        const day2monthPaste = Number(inputValue.slice(cursor - 3, cursor - 1)) <= daysCount &&
                            !inputValue.slice(cursor - 3, cursor - 1).includes('/') &&
                            inputValue[cursor - 1] !== '/' &&
                            Number(inputValue.slice(cursor - 1, cursor + 1)) > monthsCount;
                        if ((Number(inputSymbol) > 1 && this.leadZeroDateTime) ||
                            withoutDays ||
                            day1monthInput ||
                            day2monthInput ||
                            day1monthPaste ||
                            day2monthPaste) {
                            cursor += 1;
                            this._shiftStep(maskExpression, cursor, inputArray.length);
                            i--;
                            if (this.leadZeroDateTime) {
                                result += '0';
                            }
                            continue;
                        }
                    }
                    result += inputSymbol;
                    cursor++;
                }
                else if (this.maskSpecialCharacters.indexOf(maskExpression[cursor]) !== -1) {
                    result += maskExpression[cursor];
                    cursor++;
                    this._shiftStep(maskExpression, cursor, inputArray.length);
                    i--;
                }
                else if (this.maskSpecialCharacters.indexOf(inputSymbol) > -1 &&
                    this.maskAvailablePatterns[maskExpression[cursor]] &&
                    this.maskAvailablePatterns[maskExpression[cursor]].optional) {
                    if (!!inputArray[cursor] &&
                        maskExpression !== '099.099.099.099' &&
                        maskExpression !== '000.000.000-00' &&
                        maskExpression !== '00.000.000/0000-00') {
                        result += inputArray[cursor];
                    }
                    cursor++;
                    i--;
                }
                else if (this.maskExpression[cursor + 1] === '*' &&
                    this._findSpecialChar(this.maskExpression[cursor + 2]) &&
                    this._findSpecialChar(inputSymbol) === this.maskExpression[cursor + 2] &&
                    multi) {
                    cursor += 3;
                    result += inputSymbol;
                }
                else if (this.maskExpression[cursor + 1] === '?' &&
                    this._findSpecialChar(this.maskExpression[cursor + 2]) &&
                    this._findSpecialChar(inputSymbol) === this.maskExpression[cursor + 2] &&
                    multi) {
                    cursor += 3;
                    result += inputSymbol;
                }
                else if (this.showMaskTyped &&
                    this.maskSpecialCharacters.indexOf(inputSymbol) < 0 &&
                    inputSymbol !== this.placeHolderCharacter) {
                    stepBack = true;
                }
            }
        }
        if (result.length + 1 === maskExpression.length &&
            this.maskSpecialCharacters.indexOf(maskExpression[maskExpression.length - 1]) !== -1) {
            result += maskExpression[maskExpression.length - 1];
        }
        let newPosition = position + 1;
        while (this._shift.has(newPosition)) {
            shift++;
            newPosition++;
        }
        let actualShift = justPasted ? cursor : this._shift.has(position) ? shift : 0;
        if (stepBack) {
            actualShift--;
        }
        cb(actualShift, backspaceShift);
        if (shift < 0) {
            this._shift.clear();
        }
        let onlySpecial = false;
        if (backspaced) {
            onlySpecial = inputArray.every((char) => this.maskSpecialCharacters.includes(char));
        }
        let res = `${this.prefix}${onlySpecial ? '' : result}${this.suffix}`;
        if (result.length === 0) {
            res = `${this.prefix}${result}`;
        }
        return res;
    }
    _findSpecialChar(inputSymbol) {
        return this.maskSpecialCharacters.find((val) => val === inputSymbol);
    }
    _checkSymbolMask(inputSymbol, maskSymbol) {
        this.maskAvailablePatterns = this.customPattern ? this.customPattern : this.maskAvailablePatterns;
        return (this.maskAvailablePatterns[maskSymbol] &&
            this.maskAvailablePatterns[maskSymbol].pattern &&
            this.maskAvailablePatterns[maskSymbol].pattern.test(inputSymbol));
    }
    _stripToDecimal(str) {
        return str
            .split('')
            .filter((i, idx) => {
            return (i.match('^-?\\d') ||
                i.match('\\s') ||
                i === '.' ||
                i === ',' ||
                (i === '-' && idx === 0 && this.allowNegativeNumbers));
        })
            .join('');
    }
    _charToRegExpExpression(char) {
        if (char) {
            const charsToEscape = '[\\^$.|?*+()';
            return char === ' ' ? '\\s' : charsToEscape.indexOf(char) >= 0 ? '\\' + char : char;
        }
        return char;
    }
    _shiftStep(maskExpression, cursor, inputLength) {
        const shiftStep = /[*?]/g.test(maskExpression.slice(0, cursor)) ? inputLength : cursor;
        this._shift.add(shiftStep + this.prefix.length || 0);
    }
}
MaskApplierService.decorators = [
    { type: Injectable }
];
MaskApplierService.ctorParameters = () => [
    { type: undefined, decorators: [{ type: Inject, args: [config,] }] }
];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFzay1hcHBsaWVyLnNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9wcm9qZWN0cy9uZ3gtbWFzay1saWIvc3JjL2xpYi9tYXNrLWFwcGxpZXIuc2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsTUFBTSxFQUFFLFVBQVUsRUFBRSxNQUFNLGVBQWUsQ0FBQztBQUNuRCxPQUFPLEVBQUUsTUFBTSxFQUFXLE1BQU0sVUFBVSxDQUFDO0FBRzNDLE1BQU0sT0FBTyxrQkFBa0I7SUEwQjdCLFlBQTZDLE9BQWdCO1FBQWhCLFlBQU8sR0FBUCxPQUFPLENBQVM7UUFyQnRELG1CQUFjLEdBQVcsRUFBRSxDQUFDO1FBQzVCLGdCQUFXLEdBQVcsRUFBRSxDQUFDO1FBQ3pCLHdCQUFtQixHQUFXLEVBQUUsQ0FBQztRQTJZaEMsMEJBQXFCLEdBQUcsQ0FDOUIsR0FBVyxFQUNYLHFCQUE2QixFQUM3QixXQUFtQixFQUNuQixTQUFpQixFQUNqQixFQUFFO1lBQ0YsTUFBTSxDQUFDLEdBQWEsR0FBRyxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUMzQyxNQUFNLFFBQVEsR0FBVyxDQUFDLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxXQUFXLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztZQUNyRSxJQUFJLEdBQUcsR0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDdkIsTUFBTSxjQUFjLEdBQVcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ3RFLElBQUksY0FBYyxJQUFJLENBQUMsY0FBYyxFQUFFO2dCQUNyQyxJQUFJLEdBQUcsQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLEVBQUU7b0JBQ2xCLEdBQUcsR0FBRyxJQUFJLEdBQUcsQ0FB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QUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDOzRCQUN2RCxVQUFVLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxLQUFLLEdBQUc7NEJBQzlCLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLFdBQVcsSUFBSSxVQUFVLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDO3dCQUNqRywwQ0FBMEM7d0JBQzFDLE1BQU0sY0FBYyxHQUNsQixNQUFNLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLFNBQVM7NEJBQzVELENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDOzRCQUN2RCxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxNQUFNLENBQUMsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDOzRCQUNuRCxNQUFNLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDLEdBQUcsV0FBVyxDQUFDO3dCQUM3RCw2Q0FBNkM7d0JBQzdDLE1BQU0sY0FBYyxHQUNsQixNQUFNLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLFNBQVM7NEJBQzdELENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDOzRCQUN2RCxVQUFVLENBQUMsTUFBTSxHQUFH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ci9jb3JlJztcclxuaW1wb3J0IHsgY29uZmlnLCBJQ29uZmlnIH0gZnJvbSAnLi9jb25maWcnO1xyXG5cclxuQEluamVjdGFibGUoKVxyXG5leHBvcnQgY2xhc3MgTWFza0FwcGxpZXJTZXJ2aWNlIHtcclxuICBwdWJsaWMgZHJvcFNwZWNpYWxDaGFyYWN0ZXJzOiBJQ29uZmlnWydkcm9wU3BlY2lhbENoYXJhY3RlcnMnXTtcclxuICBwdWJsaWMgaGlkZGVuSW5wdXQ6IElDb25maWdbJ2hpZGRlbklucHV0J107XHJcbiAgcHVibGljIHNob3dUZW1wbGF0ZSE6IElDb25maWdbJ3Nob3dUZW1wbGF0ZSddO1xyXG4gIHB1YmxpYyBjbGVhcklmTm90TWF0Y2ghOiBJQ29uZmlnWydjbGVhcklmTm90TWF0Y2gnXTtcclxuICBwdWJsaWMgbWFza0V4cHJlc3Npb246IHN0cmluZyA9ICcnO1xyXG4gIHB1YmxpYyBhY3R1YWxWYWx1ZTogc3RyaW5nID0gJyc7XHJcbiAgcHVibGljIHNob3duTWFza0V4cHJlc3Npb246IHN0cmluZyA9ICcnO1xyXG4gIHB1YmxpYyBtYXNrU3BlY2lhbENoYXJhY3RlcnMhOiBJQ29uZmlnWydzcGVjaWFsQ2hhcmFjdGVycyddO1xyXG4gIHB1YmxpYyBtYXNrQXZhaWxhYmxlUGF0dGVybnMhOiBJQ29uZmlnWydwYXR0ZXJucyddO1xyXG4gIHB1YmxpYyBwcmVmaXghOiBJQ29uZmlnWydwcmVmaXgnXTtcclxuICBwdWJsaWMgc3VmZml4ITogSUNvbmZpZ1snc3VmZml4J107XHJcbiAgcHVibGljIHRob3VzYW5kU2VwYXJhdG9yITogSUNvbmZpZ1sndGhvdXNhbmRTZXBhcmF0b3InXTtcclxuICBwdWJsaWMgZGVjaW1hbE1hcmtlciE6IElDb25maWdbJ2RlY2ltYWxNYXJrZXInXTtcclxuICBwdWJsaWMgY3VzdG9tUGF0dGVybiE6IElDb25maWdbJ3BhdHRlcm5zJ107XHJcbiAgcHVibGljIGlwRXJyb3I/OiBib29sZWFuO1xyXG4gIHB1YmxpYyBjcGZDbnBqRXJyb3I/OiBib29sZWFuO1xyXG4gIHB1YmxpYyBzaG93TWFza1R5cGVkITogSUNvbmZpZ1snc2hvd01hc2tUeXBlZCddO1xyXG4gIHB1YmxpYyBwbGFjZUhvbGRlckNoYXJhY3RlciE6IElDb25maWdbJ3BsYWNlSG9sZGVyQ2hhcmFjdGVyJ107XHJcbiAgcHVibGljIHZhbGlkYXRpb246IElDb25maWdbJ3ZhbGlkYXRpb24nXTtcclxuICBwdWJsaWMgc2VwYXJhdG9yTGltaXQ6IElDb25maWdbJ3NlcGFyYXRvckxpbWl0J107XHJcbiAgcHVibGljIGFsbG93TmVnYXRpdmVOdW1iZXJzOiBJQ29uZmlnWydhbGxvd05lZ2F0aXZlTnVtYmVycyddO1xyXG4gIHB1YmxpYyBsZWFkWmVyb0RhdGVUaW1lOiBJQ29uZmlnWydsZWFkWmVyb0RhdGVUaW1lJ107XHJcblxyXG4gIHByaXZhdGUgX3NoaWZ0ITogU2V0PG51bWJlcj47XHJcblxyXG4gIHB1YmxpYyBjb25zdHJ1Y3RvcihASW5qZWN0KGNvbmZpZykgcHJvdGVjdGVkIF9jb25maWc6IElDb25maWcpIHtcclxuICAgIHRoaXMuX3NoaWZ0ID0gbmV3IFNldCgpO1xyXG4gICAgdGhpcy5jbGVhcklmTm90TWF0Y2ggPSB0aGlzLl9jb25maWcuY2xlYXJJZk5vdE1hdGNoO1xyXG4gICAgdGhpcy5kcm9wU3BlY2lhbENoYXJhY3RlcnMgPSB0aGlzLl9jb25maWcuZHJvcFNwZWNpYWxDaGFyYWN0ZXJzO1xyXG4gICAgdGhpcy5tYXNrU3BlY2lhbENoYXJhY3RlcnMgPSB0aGlzLl9jb25maWcuc3BlY2lhbENoYXJhY3RlcnM7XHJcbiAgICB0aGlzLm1hc2tBdmFpbGFibGVQYXR0ZXJucyA9IHRoaXMuX2NvbmZpZy5wYXR0ZXJucztcclxuICAgIHRoaXMucHJlZml4ID0gdGhpcy5fY29uZmlnLnByZWZpeDtcclxuICAgIHRoaXMuc3VmZml4ID0gdGhpcy5fY29uZmlnLnN1ZmZpeDtcclxuICAgIHRoaXMudGhvdXNhbmRTZXBhcmF0b3IgPSB0aGlzLl9jb25maWcudGhvdXNhbmRTZXBhcmF0b3I7XHJcbiAgICB0aGlzLmRlY2ltYWxNYXJrZXIgPSB0aGlzLl9jb25maWcuZGVjaW1hbE1hcmtlcjtcclxuICAgIHRoaXMuaGlkZGVuSW5wdXQgPSB0aGlzLl9jb25maWcuaGlkZGVuSW5wdXQ7XHJcbiAgICB0aGlzLnNob3dNYXNrVHlwZWQgPSB0aGlzLl9jb25maWcuc2hvd01hc2tUeXBlZDtcclxuICAgIHRoaXMucGxhY2VIb2xkZXJDaGFyYWN0ZXIgPSB0aGlzLl9jb25maWcucGxhY2VIb2xkZXJDaGFyYWN0ZXI7XHJcbiAgICB0aGlzLnZhbGlkYXRpb24gPSB0aGlzLl9jb25maWcudmFsaWRhdGlvbjtcclxuICAgIHRoaXMuc2VwYXJhdG9yTGltaXQgPSB0aGlzLl9jb25maWcuc2VwYXJhdG9yTGltaXQ7XHJcbiAgICB0aGlzLmFsbG93TmVnYXRpdmVOdW1iZXJzID0gdGhpcy5fY29uZmlnLmFsbG93TmVnYXRpdmVOdW1iZXJzO1xyXG4gICAgdGhpcy5sZWFkWmVyb0RhdGVUaW1lID0gdGhpcy5fY29uZmlnLmxlYWRaZXJvRGF0ZVRpbWU7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgYXBwbHlNYXNrV2l0aFBhdHRlcm4oaW5wdXRWYWx1ZTogc3RyaW5nLCBtYXNrQW5kUGF0dGVybjogW3N0cmluZywgSUNvbmZpZ1sncGF0dGVybnMnXV0pOiBzdHJpbmcge1xyXG4gICAgY29uc3QgW21hc2ssIGN1c3RvbVBhdHRlcm5dID0gbWFza0FuZFBhdHRlcm47XHJcbiAgICB0aGlzLmN1c3RvbVBhdHRlcm4gPSBjdXN0b21QYXR0ZXJuO1xyXG4gICAgcmV0dXJuIHRoaXMuYXBwbHlNYXNrKGlucHV0VmFsdWUsIG1hc2spO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGFwcGx5TWFzayhcclxuICAgIGlucHV0VmFsdWU6IHN0cmluZyxcclxuICAgIG1hc2tFeHByZXNzaW9uOiBzdHJpbmcsXHJcbiAgICBwb3NpdGlvbjogbnVtYmVyID0gMCxcclxuICAgIGp1c3RQYXN0ZWQ6IGJvb2xlYW4gPSBmYWxzZSxcclxuICAgIGJhY2tzcGFjZWQ6IGJvb2xlYW4gPSBmYWxzZSxcclxuICAgIGNiOiBGdW5jdGlvbiA9ICgpID0+IHt9XHJcbiAgKTogc3RyaW5nIHtcclxuICAgIGlmIChpbnB1dFZhbHVlID09PSB1bmRlZmluZWQgfHwgaW5wdXRWYWx1ZSA9PT0gbnVsbCB8fCBtYXNrRXhwcmVzc2lvbiA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIHJldHVybiAnJztcclxuICAgIH1cclxuICAgIGxldCBjdXJzb3IgPSAwO1xyXG4gICAgbGV0IHJlc3VsdCA9ICcnO1xyXG4gICAgbGV0IG11bHRpID0gZmFsc2U7XHJcbiAgICBsZXQgYmFja3NwYWNlU2hpZnQgPSBmYWxzZTtcclxuICAgIGxldCBzaGlmdCA9IDE7XHJcbiAgICBsZXQgc3RlcEJhY2sgPSBmYWxzZTtcclxuICAgIGlmIChpbnB1dFZhbHVlLnNsaWNlKDAsIHRoaXMucHJlZml4Lmxlbmd0aCkgPT09IHRoaXMucHJlZml4KSB7XHJcbiAgICAgIGlucHV0VmFsdWUgPSBpbnB1dFZhbHVlLnNsaWNlKHRoaXMucHJlZml4Lmxlbmd0aCwgaW5wdXRWYWx1ZS5sZW5ndGgpO1xyXG4gICAgfVxyXG4gICAgaWYgKCEhdGhpcy5zdWZmaXggJiYgaW5wdXRWYWx1ZT8ubGVuZ3RoID4gMCkge1xyXG4gICAgICBpbnB1dFZhbHVlID0gdGhpcy5jaGVja0FuZFJlbW92ZVN1ZmZpeChpbnB1dFZhbHVlKTtcclxuICAgIH1cclxuICAgIGNvbnN0IGlucHV0QXJyYXk6IHN0cmluZ1tdID0gaW5wdXRWYWx1ZS50b1N0cmluZygpLnNwbGl0KCcnKTtcclxuICAgIGlmIChtYXNrRXhwcmVzc2lvbiA9PT0gJ0lQJykge1xyXG4gICAgICB0aGlzLmlwRXJyb3IgPSAhIShpbnB1dEFycmF5LmZpbHRlcigoaTogc3RyaW5nKSA9PiBpID09PSAnLicpLmxlbmd0aCA8IDMgJiYgaW5wdXRBcnJheS5sZW5ndGggPCA3KTtcclxuICAgICAgbWFza0V4cHJlc3Npb24gPSAnMDk5LjA5OS4wOTkuMDk5JztcclxuICAgIH1cclxuICAgIGNvbnN0IGFycjogc3RyaW5nW10gPSBbXTtcclxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaW5wdXRWYWx1ZS5sZW5ndGg7IGkrKykge1xyXG4gICAgICBpZiAoaW5wdXRWYWx1ZVtpXS5tYXRjaCgnXFxcXGQnKSkge1xyXG4gICAgICAgIGFyci5wdXNoKGlucHV0VmFsdWVbaV0pO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICBpZiAobWFza0V4cHJlc3Npb24gPT09ICdDUEZfQ05QSicpIHtcclxuICAgICAgdGhpcy5jcGZDbnBqRXJyb3IgPSAhIShhcnIubGVuZ3RoICE9PSAxMSAmJiBhcnIubGVuZ3RoICE9PSAxNCk7XHJcbiAgICAgIGlmIChhcnIubGVuZ3RoID4gMTEpIHtcclxuICAgICAgICBtYXNrRXhwcmVzc2lvbiA9ICcwMC4wMDAuMDAwLzAwMDAtMDAnO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIG1hc2tFeHByZXNzaW9uID0gJzAwMC4wMDAuMDAwLTAwJztcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgaWYgKG1hc2tFeHByZXNzaW9uLnN0YXJ0c1dpdGgoJ3BlcmNlbnQnKSkge1xyXG4gICAgICBpZiAoaW5wdXRWYWx1ZS5tYXRjaCgnW2Etel18W0EtWl0nKSB8fCBpbnB1dFZhbHVlLm1hdGNoKC9bLSEkJV4mKigpXyt8fj1ge31cXFtcXF06XCI7Jzw+PyxcXC8uXS8pKSB7XHJcbiAgICAgICAgaW5wdXRWYWx1ZSA9IHRoaXMuX3N0cmlwVG9EZWNpbWFsKGlucHV0VmFsdWUpO1xyXG4gICAgICAgIGNvbnN0IHByZWNpc2lvbjogbnVtYmVyID0gdGhpcy5nZXRQcmVjaXNpb24obWFza0V4cHJlc3Npb24pO1xyXG4gICAgICAgIGlucHV0VmFsdWUgPSB0aGlzLmNoZWNrSW5wdXRQcmVjaXNpb24oaW5wdXRWYWx1ZSwgcHJlY2lzaW9uLCB0aGlzLmRlY2ltYWxNYXJrZXIpO1xyXG4gICAgICB9XHJcbiAgICAgIGlmIChpbnB1dFZhbHVlLmluZGV4T2YoJy4nKSA+IDAgJiYgIXRoaXMucGVyY2VudGFnZShpbnB1dFZhbHVlLnN1YnN0cmluZygwLCBpbnB1dFZhbHVlLmluZGV4T2YoJy4nKSkpKSB7XHJcbiAgICAgICAgY29uc3QgYmFzZTogc3RyaW5nID0gaW5wdXRWYWx1ZS5zdWJzdHJpbmcoMCwgaW5wdXRWYWx1ZS5pbmRleE9mKCcuJykgLSAxKTtcclxuICAgICAgICBpbnB1dFZhbHVlID0gYCR7YmFzZX0ke2lucHV0VmFsdWUuc3Vic3RyaW5nKGlucHV0VmFsdWUuaW5kZXhPZignLicpLCBpbnB1dFZhbHVlLmxlbmd0aCl9YDtcclxuICAgICAgfVxyXG4gICAgICBpZiAodGhpcy5wZXJjZW50YWdlKGlucHV0VmFsdWUpKSB7XHJcbiAgICAgICAgcmVzdWx0ID0gaW5wdXRWYWx1ZTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICByZXN1bHQgPSBpbnB1dFZhbHVlLnN1YnN0cmluZygwLCBpbnB1dFZhbHVlLmxlbmd0aCAtIDEpO1xyXG4gICAgICB9XHJcbiAgICB9IGVsc2UgaWYgKG1hc2tFeHByZXNzaW9uLnN0YXJ0c1dpdGgoJ3NlcGFyYXRvcicpKSB7XHJcbiAgICAgIGlmIChcclxuICAgICAgICBpbnB1dFZhbHVlLm1hdGNoKCdbd9CwLdGP0JAt0K9dJykgfHxcclxuICAgICAgICBpbnB1dFZhbHVlLm1hdGNoKCdb0IHRkdCQLdGPXScpIHx8XHJcbiAgICAgICAgaW5wdXRWYWx1ZS5tYXRjaCgnW2Etel18W0EtWl0nKSB8fFxyXG4gICAgICAgIGlucHV0VmFsdWUubWF0Y2goL1stQCMhJCVcXFxcXiYqKClfwqPCrCcrfH49YHt9XFxbXFxdOlwiOzw+Lj9cXC9dLykgfHxcclxuICAgICAgICBpbnB1dFZhbHVlLm1hdGNoKCdbXkEtWmEtejAtOSxdJylcclxuICAgICAgKSB7XHJcbiAgICAgICAgaW5wdXRWYWx1ZSA9IHRoaXMuX3N0cmlwVG9EZWNpbWFsKGlucHV0VmFsdWUpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpbnB1dFZhbHVlID1cclxuICAgICAgICBpbnB1dFZhbHVlLmxlbmd0aCA+IDEgJiYgaW5wdXRWYWx1ZVswXSA9PT0gJzAnICYmIGlucHV0VmFsdWVbMV0gIT09IHRoaXMuZGVjaW1hbE1hcmtlclxyXG4gICAgICAgICAgPyBpbnB1dFZhbHVlLnNsaWNlKDEsIGlucHV0VmFsdWUubGVuZ3RoKVxyXG4gICAgICAgICAgOiBpbnB1dFZhbHVlO1xyXG5cclxuICAgICAgLy8gVE9ETzogd2UgaGFkIGRpZmZlcmVudCByZXhleHBzIGhlcmUgZm9yIHRoZSBkaWZmZXJlbnQgY2FzZXMuLi4gYnV0IHRlc3RzIGRvbnQgc2VhbSB0byBib3RoZXIgLSBjaGVjayB0aGlzXHJcbiAgICAgIC8vICBzZXBhcmF0b3I6IG5vIENPTU1BLCBkb3Qtc2VwOiBubyBTUEFDRSwgQ09NTUEgT0ssIGNvbW1hLXNlcDogbm8gU1BBQ0UsIENPTU1BIE9LXHJcblxyXG4gICAgICBjb25zdCB0aG91c2FuZFNlcGVyYXRvckNoYXJFc2NhcGVkOiBzdHJpbmcgPSB0aGlzLl9jaGFyVG9SZWdFeHBFeHByZXNzaW9uKHRoaXMudGhvdXNhbmRTZXBhcmF0b3IpO1xyXG4gICAgICBjb25zdCBkZWNpbWFsTWFya2VyRXNjYXBlZDogc3RyaW5nID0gdGhpcy5fY2hhclRvUmVnRXhwRXhwcmVzc2lvbih0aGlzLmRlY2ltYWxNYXJrZXIpO1xyXG4gICAgICBjb25zdCBpbnZhbGlkQ2hhcnM6IHN0cmluZyA9ICdAIyEkJV4mKigpXyt8fj1ge31cXFxcW1xcXFxdOlxcXFxzLFxcXFwuXCI7PD4/XFxcXC8nXHJcbiAgICAgICAgLnJlcGxhY2UodGhvdXNhbmRTZXBlcmF0b3JDaGFyRXNjYXBlZCwgJycpXHJcbiAgICAgICAgLnJlcGxhY2UoZGVjaW1hbE1hcmtlckVzY2FwZWQsICcnKTtcclxuXHJcbiAgICAgIGNvbnN0IGludmFsaWRDaGFyUmVnZXhwOiBSZWdFeHAgPSBuZXcgUmVnRXhwKCdbJyArIGludmFsaWRDaGFycyArICddJyk7XHJcblxyXG4gICAgICBpZiAoaW5wdXRWYWx1ZS5tYXRjaChpbnZhbGlkQ2hhclJlZ2V4cCkpIHtcclxuICAgICAgICBpbnB1dFZhbHVlID0gaW5wdXRWYWx1ZS5zdWJzdHJpbmcoMCwgaW5wdXRWYWx1ZS5sZW5ndGggLSAxKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgY29uc3QgcHJlY2lzaW9uOiBudW1iZXIgPSB0aGlzLmdldFByZWNpc2lvbihtYXNrRXhwcmVzc2lvbik7XHJcbiAgICAgIGlucHV0VmFsdWUgPSB0aGlzLmNoZWNrSW5wdXRQcmVjaXNpb24oaW5wdXRWYWx1ZSwgcHJlY2lzaW9uLCB0aGlzLmRlY2ltYWxNYXJrZXIpO1xyXG4gICAgICBjb25zdCBzdHJGb3JTZXA6IHN0cmluZyA9IGlucHV0VmFsdWUucmVwbGFjZShuZXcgUmVnRXhwKHRob3VzYW5kU2VwZXJhdG9yQ2hhckVzY2FwZWQsICdnJyksICcnKTtcclxuICAgICAgcmVzdWx0ID0gdGhpcy5fZm9ybWF0V2l0aFNlcGFyYXRvcnMoc3RyRm9yU2VwLCB0aGlzLnRob3VzYW5kU2VwYXJhdG9yLCB0aGlzLmRlY2ltYWxNYXJrZXIsIHByZWNpc2lvbik7XHJcblxyXG4gICAgICBjb25zdCBjb21tYVNoaWZ0OiBudW1iZXIgPSByZXN1bHQuaW5kZXhPZignLCcpIC0gaW5wdXRWYWx1ZS5pbmRleE9mKCcsJyk7XHJcbiAgICAgIGNvbnN0IHNoaWZ0U3RlcDogbnVtYmVyID0gcmVzdWx0Lmxlbmd0aCAtIGlucHV0VmFsdWUubGVuZ3RoO1xyXG5cclxuICAgICAgaWYgKHNoaWZ0U3RlcCA+IDAgJiYgcmVzdWx0W3Bvc2l0aW9uXSAhPT0gJywnKSB7XHJcbiAgICAgICAgYmFja3NwYWNlU2hpZnQgPSB0cnVlO1xyXG4gICAgICAgIGxldCBfc2hpZnQgPSAwO1xyXG4gICAgICAgIGRvIHtcclxuICAgICAgICAgIHRoaXMuX3NoaWZ0LmFkZChwb3NpdGlvbiArIF9zaGlmdCk7XHJcbiAgICAgICAgICBfc2hpZnQrKztcclxuICAgICAgICB9IHdoaWxlIChfc2hpZnQgPCBzaGlmdFN0ZXApO1xyXG4gICAgICB9IGVsc2UgaWYgKFxyXG4gICAgICAgIChjb21tYVNoaWZ0ICE9PSAwICYmIHBvc2l0aW9uID4gMCAmJiAhKHJlc3VsdC5pbmRleE9mKCcsJykgPj0gcG9zaXRpb24gJiYgcG9zaXRpb24gPiAzKSkgfHxcclxuICAgICAgICAoIShyZXN1bHQuaW5kZXhPZignLicpID49IHBvc2l0aW9uICYmIHBvc2l0aW9uID4gMykgJiYgc2hpZnRTdGVwIDw9IDApXHJcbiAgICAgICkge1xyXG4gICAgICAgIHRoaXMuX3NoaWZ0LmNsZWFyKCk7XHJcbiAgICAgICAgYmFja3NwYWNlU2hpZnQgPSB0cnVlO1xyXG4gICAgICAgIHNoaWZ0ID0gc2hpZnRTdGVwO1xyXG4gICAgICAgIHBvc2l0aW9uICs9IHNoaWZ0U3RlcDtcclxuICAgICAgICB0aGlzLl9zaGlmdC5hZGQocG9zaXRpb24pO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRoaXMuX3NoaWZ0LmNsZWFyKCk7XHJcbiAgICAgIH1cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGZvciAoXHJcbiAgICAgICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lXHJcbiAgICAgICAgbGV0IGk6IG51bWJlciA9IDAsIGlucHV0U3ltYm9sOiBzdHJpbmcgPSBpbnB1dEFycmF5WzBdO1xyXG4gICAgICAgIGkgPCBpbnB1dEFycmF5Lmxlbmd0aDtcclxuICAgICAgICBpKyssIGlucHV0U3ltYm9sID0gaW5wdXRBcnJheVtpXVxyXG4gICAgICApIHtcclxuICAgICAgICBpZiAoY3Vyc29yID09PSBtYXNrRXhwcmVzc2lvbi5sZW5ndGgpIHtcclxuICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodGhpcy5fY2hlY2tTeW1ib2xNYXNrKGlucHV0U3ltYm9sLCBtYXNrRXhwcmVzc2lvbltjdXJzb3JdKSAmJiBtYXNrRXhwcmVzc2lvbltjdXJzb3IgKyAxXSA9PT0gJz8nKSB7XHJcbiAgICAgICAgICByZXN1bHQgKz0gaW5wdXRTeW1ib2w7XHJcbiAgICAgICAgICBjdXJzb3IgKz0gMjtcclxuICAgICAgICB9IGVsc2UgaWYgKFxyXG4gICAgICAgICAgbWFza0V4cHJlc3Npb25bY3Vyc29yICsgMV0gPT09ICcqJyAmJlxyXG4gICAgICAgICAgbXVsdGkgJiZcclxuICAgICAgICAgIHRoaXMuX2NoZWNrU3ltYm9sTWFzayhpbnB1dFN5bWJvbCwgbWFza0V4cHJlc3Npb25bY3Vyc29yICsgMl0pXHJcbiAgICAgICAgKSB7XHJcbiAgICAgICAgICByZXN1bHQgKz0gaW5wdXRTeW1ib2w7XHJcbiAgICAgICAgICBjdXJzb3IgKz0gMztcclxuICAgICAgICAgIG11bHRpID0gZmFsc2U7XHJcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLl9jaGVja1N5bWJvbE1hc2soaW5wdXRTeW1ib2wsIG1hc2tFeHByZXNzaW9uW2N1cnNvcl0pICYmIG1hc2tFeHByZXNzaW9uW2N1cnNvciArIDFdID09PSAnKicpIHtcclxuICAgICAgICAgIHJlc3VsdCArPSBpbnB1dFN5bWJvbDtcclxuICAgICAgICAgIG11bHRpID0gdHJ1ZTtcclxuICAgICAgICB9IGVsc2UgaWYgKFxyXG4gICAgICAgICAgbWFza0V4cHJlc3Npb25bY3Vyc29yICsgMV0gPT09ICc/JyAmJlxyXG4gICAgICAgICAgdGhpcy5fY2hlY2tTeW1ib2xNYXNrKGlucHV0U3ltYm9sLCBtYXNrRXhwcmVzc2lvbltjdXJzb3IgKyAyXSlcclxuICAgICAgICApIHtcclxuICAgICAgICAgIHJlc3VsdCArPSBpbnB1dFN5bWJvbDtcclxuICAgICAgICAgIGN1cnNvciArPSAzO1xyXG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5fY2hlY2tTeW1ib2xNYXNrKGlucHV0U3ltYm9sLCBtYXNrRXhwcmVzc2lvbltjdXJzb3JdKSkge1xyXG4gICAgICAgICAgaWYgKG1hc2tFeHByZXNzaW9uW2N1cnNvcl0gPT09ICdIJykge1xyXG4gICAgICAgICAgICBpZiAoTnVtYmVyKGlucHV0U3ltYm9sKSA+IDIpIHtcclxuICAgICAgICAgICAgICBjdXJzb3IgKz0gMTtcclxuICAgICAgICAgICAgICB0aGlzLl9zaGlmdFN0ZXAobWFza0V4cHJlc3Npb24sIGN1cnNvciwgaW5wdXRBcnJheS5sZW5ndGgpO1xyXG4gICAgICAgICAgICAgIGktLTtcclxuICAgICAgICAgICAgICBpZiAodGhpcy5sZWFkWmVyb0RhdGVUaW1lKSB7XHJcbiAgICAgICAgICAgICAgICByZXN1bHQgKz0gJzAnO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgaWYgKG1hc2tFeHByZXNzaW9uW2N1cnNvcl0gPT09ICdoJykge1xyXG4gICAgICAgICAgICBpZiAocmVzdWx0ID09PSAnMicgJiYgTnVtYmVyKGlucHV0U3ltYm9sKSA+IDMpIHtcclxuICAgICAgICAgICAgICBjdXJzb3IgKz0gMTtcclxuICAgICAgICAgICAgICBpLS07XHJcbiAgICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGlmIChtYXNrRXhwcmVzc2lvbltjdXJzb3JdID09PSAnbScpIHtcclxuICAgICAgICAgICAgaWYgKE51bWJlcihpbnB1dFN5bWJvbCkgPiA1KSB7XHJcbiAgICAgICAgICAgICAgY3Vyc29yICs9IDE7XHJcbiAgICAgICAgICAgICAgdGhpcy5fc2hpZnRTdGVwKG1hc2tFeHByZXNzaW9uLCBjdXJzb3IsIGlucHV0QXJyYXkubGVuZ3RoKTtcclxuICAgICAgICAgICAgICBpLS07XHJcbiAgICAgICAgICAgICAgaWYgKHRoaXMubGVhZFplcm9EYXRlVGltZSkge1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0ICs9ICcwJztcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGlmIChtYXNrRXhwcmVzc2lvbltjdXJzb3JdID09PSAncycpIHtcclxuICAgICAgICAgICAgaWYgKE51bWJlcihpbnB1dFN5bWJvbCkgPiA1KSB7XHJcbiAgICAgICAgICAgICAgY3Vyc29yICs9IDE7XHJcbiAgICAgICAgICAgICAgdGhpcy5fc2hpZnRTdGVwKG1hc2tFeHByZXNzaW9uLCBjdXJzb3IsIGlucHV0QXJyYXkubGVuZ3RoKTtcclxuICAgICAgICAgICAgICBpLS07XHJcbiAgICAgICAgICAgICAgaWYgKHRoaXMubGVhZFplcm9EYXRlVGltZSkge1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0ICs9ICcwJztcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGNvbnN0IGRheXNDb3VudCA9IDMxO1xyXG4gICAgICAgICAgaWYgKG1hc2tFeHByZXNzaW9uW2N1cnNvcl0gPT09ICdkJykge1xyXG4gICAgICAgICAgICBpZiAoXHJcbiAgICAgICAgICAgICAgKE51bWJlcihpbnB1dFN5bWJvbCkgPiAzICYmIHRoaXMubGVhZFplcm9EYXRlVGltZSkgfHxcclxuICAgICAgICAgICAgICBOdW1iZXIoaW5wdXRWYWx1ZS5zbGljZShjdXJzb3IsIGN1cnNvciArIDIpKSA+IGRheXNDb3VudCB8fFxyXG4gICAgICAgICAgICAgIGlucHV0VmFsdWVbY3Vyc29yICsgMV0gPT09ICcvJ1xyXG4gICAgICAgICAgICApIHtcclxuICAgICAgICAgICAgICBjdXJzb3IgKz0gMTtcclxuICAgICAgICAgICAgICB0aGlzLl9zaGlmdFN0ZXAobWFza0V4cHJlc3Npb24sIGN1cnNvciwgaW5wdXRBcnJheS5sZW5ndGgpO1xyXG4gICAgICAgICAgICAgIGktLTtcclxuICAgICAgICAgICAgICBpZiAodGhpcy5sZWFkWmVyb0RhdGVUaW1lKSB7XHJcbiAgICAgICAgICAgICAgICByZXN1bHQgKz0gJzAnO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgaWYgKG1hc2tFeHByZXNzaW9uW2N1cnNvcl0gPT09ICdNJykge1xyXG4gICAgICAgICAgICBjb25zdCBtb250aHNDb3VudCA9IDEyO1xyXG4gICAgICAgICAgICAvLyBtYXNrIHdpdGhvdXQgZGF5XHJcbiAgICAgICAgICAgIGNvbnN0IHdpdGhvdXREYXlzOiBib29sZWFuID1cclxuICAgICAgICAgICAgICBjdXJzb3IgPT09IDAgJiZcclxuICAgICAgICAgICAgICAoTnVtYmVyKGlucHV0U3ltYm9sKSA+IDIgfHxcclxuICAgICAgICAgICAgICAgIE51bWJlcihpbnB1dFZhbHVlLnNsaWNlKGN1cnNvciwgY3Vyc29yICsgMikpID4gbW9udGhzQ291bnQgfHxcclxuICAgICAgICAgICAgICAgIGlucHV0VmFsdWVbY3Vyc29yICsgMV0gPT09ICcvJyk7XHJcbiAgICAgICAgICAgIC8vIGRheTwxMCAmJiBtb250aDwxMiBmb3IgaW5wdXRcclxuICAgICAgICAgICAgY29uc3QgZGF5MW1vbnRoSW5wdXQ6IGJvb2xlYW4gPVxyXG4gICAgICAgICAgICAgIGlucHV0VmFsdWUuc2xpY2UoY3Vyc29yIC0gMywgY3Vyc29yIC0gMSkuaW5jbHVkZXMoJy8nKSAmJlxyXG4gICAgICAgICAgICAgICgoaW5wdXRWYWx1ZVtjdXJzb3IgLSAyXSA9PT0gJy8nICYmXHJcbiAgICAgICAgICAgICAgICBOdW1iZXIoaW5wdXRWYWx1ZS5zbGljZShjdXJzb3IgLSAxLCBjdXJzb3IgKyAxKSkgPiBtb250aHNDb3VudCAmJlxyXG4gICAgICAgICAgICAgICAgaW5wdXRWYWx1ZVtjdXJzb3JdICE9PSAnLycpIHx8XHJcbiAgICAgICAgICAgICAgICBpbnB1dFZhbHVlW2N1cnNvcl0gPT09ICcvJyB8fFxyXG4gICAgICAgICAgICAgICAgKGlucHV0VmFsdWVbY3Vyc29yIC0gM10gPT09ICcvJyAmJlxyXG4gICAgICAgICAgICAgICAgICBOdW1iZXIoaW5wdXRWYWx1ZS5zbGljZShjdXJzb3IgLSAyLCBjdXJzb3IpKSA+IG1vbnRoc0NvdW50ICYmXHJcbiAgICAgICAgICAgICAgICAgIGlucHV0VmFsdWVbY3Vyc29yIC0gMV0gIT09ICcvJykgfHxcclxuICAgICAgICAgICAgICAgIGlucHV0VmFsdWVbY3Vyc29yIC0gMV0gPT09ICcvJyk7XHJcbiAgICAgICAgICAgIC8vIDEwPGRheTwzMSAmJiBtb250aDwxMiBmb3IgaW5wdXRcclxuICAgICAgICAgICAgY29uc3QgZGF5Mm1vbnRoSW5wdXQ6IGJvb2xlYW4gPVxyXG4gICAgICAgICAgICAgIE51bWJlcihpbnB1dFZhbHVlLnNsaWNlKGN1cnNvciAtIDMsIGN1cnNvciAtIDEpKSA8PSBkYXlzQ291bnQgJiZcclxuICAgICAgICAgICAgICAhaW5wdXRWYWx1ZS5zbGljZShjdXJzb3IgLSAzLCBjdXJzb3IgLSAxKS5pbmNsdWRlcygnLycpICYmXHJcbiAgICAgICAgICAgICAgaW5wdXRWYWx1ZVtjdXJzb3IgLSAxXSA9PT0gJy8nICYmXHJcbiAgICAgICAgICAgICAgKE51bWJlcihpbnB1dFZhbHVlLnNsaWNlKGN1cnNvciwgY3Vyc29yICsgMikpID4gbW9udGhzQ291bnQgfHwgaW5wdXRWYWx1ZVtjdXJzb3IgKyAxXSA9PT0gJy8nKTtcclxuICAgICAgICAgICAgLy8gZGF5PDEwICYmIG1vbnRoPDEyIGZvciBwYXN0ZSB3aG9sZSBkYXRhXHJcbiAgICAgICAgICAgIGNvbnN0IGRheTFtb250aFBhc3RlOiBib29sZWFuID1cclxuICAgICAgICAgICAgICBOdW1iZXIoaW5wdXRWYWx1ZS5zbGljZShjdXJzb3IgLSAzLCBjdXJzb3IgLSAxKSkgPiBkYXlzQ291bnQgJiZcclxuICAgICAgICAgICAgICAhaW5wdXRWYWx1ZS5zbGljZShjdXJzb3IgLSAzLCBjdXJzb3IgLSAxKS5pbmNsdWRlcygnLycpICYmXHJcbiAgICAgICAgICAgICAgIWlucHV0VmFsdWUuc2xpY2UoY3Vyc29yIC0gMiwgY3Vyc29yKS5pbmNsdWRlcygnLycpICYmXHJcbiAgICAgICAgICAgICAgTnVtYmVyKGlucHV0VmFsdWUuc2xpY2UoY3Vyc29yIC0gMiwgY3Vyc29yKSkgPiBtb250aHNDb3VudDtcclxuICAgICAgICAgICAgLy8gMTA8ZGF5PDMxICYmIG1vbnRoPDEyIGZvciBwYXN0ZSB3aG9sZSBkYXRhXHJcbiAgICAgICAgICAgIGNvbnN0IGRheTJtb250aFBhc3RlOiBib29sZWFuID1cclxuICAgICAgICAgICAgICBOdW1iZXIoaW5wdXRWYWx1ZS5zbGljZShjdXJzb3IgLSAzLCBjdXJzb3IgLSAxKSkgPD0gZGF5c0NvdW50ICYmXHJcbiAgICAgICAgICAgICAgIWlucHV0VmFsdWUuc2xpY2UoY3Vyc29yIC0gMywgY3Vyc29yIC0gMSkuaW5jbHVkZXMoJy8nKSAmJlxyXG4gICAgICAgICAgICAgIGlucHV0VmFsdWVbY3Vyc29yIC0gMV0gIT09ICcvJyAmJlxyXG4gICAgICAgICAgICAgIE51bWJlcihpbnB1dFZhbHVlLnNsaWNlKGN1cnNvciAtIDEsIGN1cnNvciArIDEpKSA+IG1vbnRoc0NvdW50O1xyXG5cclxuICAgICAgICAgICAgaWYgKFxyXG4gICAgICAgICAgICAgIChOdW1iZXIoaW5wdXRTeW1ib2wpID4gMSAmJiB0aGlzLmxlYWRaZXJvRGF0ZVRpbWUpIHx8XHJcbiAgICAgICAgICAgICAgd2l0aG91dERheXMgfHxcclxuICAgICAgICAgICAgICBkYXkxbW9udGhJbnB1dCB8fFxyXG4gICAgICAgICAgICAgIGRheTJtb250aElucHV0IHx8XHJcbiAgICAgICAgICAgICAgZGF5MW1vbnRoUGFzdGUgfHxcclxuICAgICAgICAgICAgICBkYXkybW9udGhQYXN0ZVxyXG4gICAgICAgICAgICApIHtcclxuICAgICAgICAgICAgICBjdXJzb3IgKz0gMTtcclxuICAgICAgICAgICAgICB0aGlzLl9zaGlmdFN0ZXAobWFza0V4cHJlc3Npb24sIGN1cnNvciwgaW5wdXRBcnJheS5sZW5ndGgpO1xyXG4gICAgICAgICAgICAgIGktLTtcclxuICAgICAgICAgICAgICBpZiAodGhpcy5sZWFkWmVyb0RhdGVUaW1lKSB7XHJcbiAgICAgICAgICAgICAgICByZXN1bHQgKz0gJzAnO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgcmVzdWx0ICs9IGlucHV0U3ltYm9sO1xyXG4gICAgICAgICAgY3Vyc29yKys7XHJcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLm1hc2tTcGVjaWFsQ2hhcmFjdGVycy5pbmRleE9mKG1hc2tFeHByZXNzaW9uW2N1cnNvcl0pICE9PSAtMSkge1xyXG4gICAgICAgICAgcmVzdWx0ICs9IG1hc2tFeHByZXNzaW9uW2N1cnNvcl07XHJcbiAgICAgICAgICBjdXJzb3IrKztcclxuICAgICAgICAgIHRoaXMuX3NoaWZ0U3RlcChtYXNrRXhwcmVzc2lvbiwgY3Vyc29yLCBpbnB1dEFycmF5Lmxlbmd0aCk7XHJcbiAgICAgICAgICBpLS07XHJcbiAgICAgICAgfSBlbHNlIGlmIChcclxuICAgICAgICAgIHRoaXMubWFza1NwZWNpYWxDaGFyYWN0ZXJzLmluZGV4T2YoaW5wdXRTeW1ib2wpID4gLTEgJiZcclxuICAgICAgICAgIHRoaXMubWFza0F2YWlsYWJsZVBhdHRlcm5zW21hc2tFeHByZXNzaW9uW2N1cnNvcl1dICYmXHJcbiAgICAgICAgICB0aGlzLm1hc2tBdmFpbGFibGVQYXR0ZXJuc1ttYXNrRXhwcmVzc2lvbltjdXJzb3JdXS5vcHRpb25hbFxyXG4gICAgICAgICkge1xyXG4gICAgICAgICAgaWYgKFxyXG4gICAgICAgICAgICAhIWlucHV0QXJyYXlbY3Vyc29yXSAmJlxyXG4gICAgICAgICAgICBtYXNrRXhwcmVzc2lvbiAhPT0gJzA5OS4wOTkuMDk5LjA5OScgJiZcclxuICAgICAgICAgICAgbWFza0V4cHJlc3Npb24gIT09ICcwMDAuMDAwLjAwMC0wMCcgJiZcclxuICAgICAgICAgICAgbWFza0V4cHJlc3Npb24gIT09ICcwMC4wMDAuMDAwLzAwMDAtMDAnXHJcbiAgICAgICAgICApIHtcclxuICAgICAgICAgICAgcmVzdWx0ICs9IGlucHV0QXJyYXlbY3Vyc29yXTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGN1cnNvcisrO1xyXG4gICAgICAgICAgaS0tO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoXHJcbiAgICAgICAgICB0aGlzLm1hc2tFeHByZXNzaW9uW2N1cnNvciArIDFdID09PSAnKicgJiZcclxuICAgICAgICAgIHRoaXMuX2ZpbmRTcGVjaWFsQ2hhcih0aGlzLm1hc2tFeHByZXNzaW9uW2N1cnNvciArIDJdKSAmJlxyXG4gICAgICAgICAgdGhpcy5fZmluZFNwZWNpYWxDaGFyKGlucHV0U3ltYm9sKSA9PT0gdGhpcy5tYXNrRXhwcmVzc2lvbltjdXJzb3IgKyAyXSAmJlxyXG4gICAgICAgICAgbXVsdGlcclxuICAgICAgICApIHtcclxuICAgICAgICAgIGN1cnNvciArPSAzO1xyXG4gICAgICAgICAgcmVzdWx0ICs9IGlucHV0U3ltYm9sO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoXHJcbiAgICAgICAgICB0aGlzLm1hc2tFeHByZXNzaW9uW2N1cnNvciArIDFdID09PSAnPycgJiZcclxuICAgICAgICAgIHRoaXMuX2ZpbmRTcGVjaWFsQ2hhcih0aGlzLm1hc2tFeHByZXNzaW9uW2N1cnNvciArIDJdKSAmJlxyXG4gICAgICAgICAgdGhpcy5fZmluZFNwZWNpYWxDaGFyKGlucHV0U3ltYm9sKSA9PT0gdGhpcy5tYXNrRXhwcmVzc2lvbltjdXJzb3IgKyAyXSAmJlxyXG4gICAgICAgICAgbXVsdGlcclxuICAgICAgICApIHtcclxuICAgICAgICAgIGN1cnNvciArPSAzO1xyXG4gICAgICAgICAgcmVzdWx0ICs9IGlucHV0U3ltYm9sO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoXHJcbiAgICAgICAgICB0aGlzLnNob3dNYXNrVHlwZWQgJiZcclxuICAgICAgICAgIHRoaXMubWFza1NwZWNpYWxDaGFyYWN0ZXJzLmluZGV4T2YoaW5wdXRTeW1ib2wpIDwgMCAmJlxyXG4gICAgICAgICAgaW5wdXRTeW1ib2wgIT09IHRoaXMucGxhY2VIb2xkZXJDaGFyYWN0ZXJcclxuICAgICAgICApIHtcclxuICAgICAgICAgIHN0ZXBCYWNrID0gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIGlmIChcclxuICAgICAgcmVzdWx0Lmxlbmd0aCArIDEgPT09IG1hc2tFeHByZXNzaW9uLmxlbmd0aCAmJlxyXG4gICAgICB0aGlzLm1hc2tTcGVjaWFsQ2hhcmFjdGVycy5pbmRleE9mKG1hc2tFeHByZXNzaW9uW21hc2tFeHByZXNzaW9uLmxlbmd0aCAtIDFdKSAhPT0gLTFcclxuICAgICkge1xyXG4gICAgICByZXN1bHQgKz0gbWFza0V4cHJlc3Npb25bbWFza0V4cHJlc3Npb24ubGVuZ3RoIC0gMV07XHJcbiAgICB9XHJcblxyXG4gICAgbGV0IG5ld1Bvc2l0aW9uOiBudW1iZXIgPSBwb3NpdGlvbiArIDE7XHJcblxyXG4gICAgd2hpbGUgKHRoaXMuX3NoaWZ0LmhhcyhuZXdQb3NpdGlvbikpIHtcclxuICAgICAgc2hpZnQrKztcclxuICAgICAgbmV3UG9zaXRpb24rKztcclxuICAgIH1cclxuXHJcbiAgICBsZXQgYWN0dWFsU2hpZnQ6IG51bWJlciA9IGp1c3RQYXN0ZWQgPyBjdXJzb3IgOiB0aGlzLl9zaGlmdC5oYXMocG9zaXRpb24pID8gc2hpZnQgOiAwO1xyXG4gICAgaWYgKHN0ZXBCYWNrKSB7XHJcbiAgICAgIGFjdHVhbFNoaWZ0LS07XHJcbiAgICB9XHJcblxyXG4gICAgY2IoYWN0dWFsU2hpZnQsIGJhY2tzcGFjZVNoaWZ0KTtcclxuICAgIGlmIChzaGlmdCA8IDApIHtcclxuICAgICAgdGhpcy5fc2hpZnQuY2xlYXIoKTtcclxuICAgIH1cclxuICAgIGxldCBvbmx5U3BlY2lhbCA9IGZhbHNlO1xyXG4gICAgaWYgKGJhY2tzcGFjZWQpIHtcclxuICAgICAgb25seVNwZWNpYWwgPSBpbnB1dEFycmF5LmV2ZXJ5KChjaGFyKSA9PiB0aGlzLm1hc2tTcGVjaWFsQ2hhcmFjdGVycy5pbmNsdWRlcyhjaGFyKSk7XHJcbiAgICB9XHJcbiAgICBsZXQgcmVzID0gYCR7dGhpcy5wcmVmaXh9JHtvbmx5U3BlY2lhbCA/ICcnIDogcmVzdWx0fSR7dGhpcy5zdWZmaXh9YDtcclxuICAgIGlmIChyZXN1bHQubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgIHJlcyA9IGAke3RoaXMucHJlZml4fSR7cmVzdWx0fWA7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gcmVzO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIF9maW5kU3BlY2lhbENoYXIoaW5wdXRTeW1ib2w6IHN0cmluZyk6IHVuZGVmaW5lZCB8IHN0cmluZyB7XHJcbiAgICByZXR1cm4gdGhpcy5tYXNrU3BlY2lhbENoYXJhY3RlcnMuZmluZCgodmFsOiBzdHJpbmcpID0+IHZhbCA9PT0gaW5wdXRTeW1ib2wpO1xyXG4gIH1cclxuXHJcbiAgcHJvdGVjdGVkIF9jaGVja1N5bWJvbE1hc2soaW5wdXRTeW1ib2w6IHN0cmluZywgbWFza1N5bWJvbDogc3RyaW5nKTogYm9vbGVhbiB7XHJcbiAgICB0aGlzLm1hc2tBdmFpbGFibGVQYXR0ZXJucyA9IHRoaXMuY3VzdG9tUGF0dGVybiA/IHRoaXMuY3VzdG9tUGF0dGVybiA6IHRoaXMubWFza0F2YWlsYWJsZVBhdHRlcm5zO1xyXG4gICAgcmV0dXJuIChcclxuICAgICAgdGhpcy5tYXNrQXZhaWxhYmxlUGF0dGVybnNbbWFza1N5bWJvbF0gJiZcclxuICAgICAgdGhpcy5tYXNrQXZhaWxhYmxlUGF0dGVybnNbbWFza1N5bWJvbF0ucGF0dGVybiAmJlxyXG4gICAgICB0aGlzLm1hc2tBdmFpbGFibGVQYXR0ZXJuc1ttYXNrU3ltYm9sXS5wYXR0ZXJuLnRlc3QoaW5wdXRTeW1ib2wpXHJcbiAgICApO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBfZm9ybWF0V2l0aFNlcGFyYXRvcnMgPSAoXHJcbiAgICBzdHI6IHN0cmluZyxcclxuICAgIHRob3VzYW5kU2VwYXJhdG9yQ2hhcjogc3RyaW5nLFxyXG4gICAgZGVjaW1hbENoYXI6IHN0cmluZyxcclxuICAgIHByZWNpc2lvbjogbnVtYmVyXHJcbiAgKSA9PiB7XHJcbiAgICBjb25zdCB4OiBzdHJpbmdbXSA9IHN0ci5zcGxpdChkZWNpbWFsQ2hhcik7XHJcbiAgICBjb25zdCBkZWNpbWFsczogc3RyaW5nID0geC5sZW5ndGggPiAxID8gYCR7ZGVjaW1hbENoYXJ9JHt4WzFdfWAgOiAnJztcclxuICAgIGxldCByZXM6IHN0cmluZyA9IHhbMF07XHJcbiAgICBjb25zdCBzZXBhcmF0b3JMaW1pdDogc3RyaW5nID0gdGhpcy5zZXBhcmF0b3JMaW1pdC5yZXBsYWNlKC9cXHMvZywgJycpO1xyXG4gICAgaWYgKHNlcGFyYXRvckxpbWl0ICYmICtzZXBhcmF0b3JMaW1pdCkge1xyXG4gICAgICBpZiAocmVzWzBdID09PSAnLScpIHtcclxuICAgICAgICByZXMgPSBgLSR7cmVzLnNsaWNlKDEsIHJlcy5sZW5ndGgpLnNsaWNlKDAsIHNlcGFyYXRvckxpbWl0Lmxlbmd0aCl9YDtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICByZXMgPSByZXMuc2xpY2UoMCwgc2VwYXJhdG9yTGltaXQubGVuZ3RoKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgY29uc3Qgcmd4OiBSZWdFeHAgPSAvKFxcZCspKFxcZHszfSkvO1xyXG5cclxuICAgIHdoaWxlICh0aG91c2FuZFNlcGFyYXRvckNoYXIgJiYgcmd4LnRlc3QocmVzKSkge1xyXG4gICAgICByZXMgPSByZXMucmVwbGFjZShyZ3gsICckMScgKyB0aG91c2FuZFNlcGFyYXRvckNoYXIgKyAnJDInKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAocHJlY2lzaW9uID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgcmV0dXJuIHJlcyArIGRlY2ltYWxzO1xyXG4gICAgfSBlbHNlIGlmIChwcmVjaXNpb24gPT09IDApIHtcclxuICAgICAgcmV0dXJuIHJlcztcclxuICAgIH1cclxuICAgIHJldHVybiByZXMgKyBkZWNpbWFscy5zdWJzdHIoMCwgcHJlY2lzaW9uICsgMSk7XHJcbiAgfTtcclxuXHJcbiAgcHJpdmF0ZSBwZXJjZW50YWdlID0gKHN0cjogc3RyaW5nKTogYm9vbGVhbiA9PiB7XHJcbiAgICByZXR1cm4gTnVtYmVyKHN0cikgPj0gMCAmJiBOdW1iZXIoc3RyKSA8PSAxMDA7XHJcbiAgfTtcclxuXHJcbiAgcHJpdmF0ZSBnZXRQcmVjaXNpb24gPSAobWFza0V4cHJlc3Npb246IHN0cmluZyk6IG51bWJlciA9PiB7XHJcbiAgICBjb25zdCB4OiBzdHJpbmdbXSA9IG1hc2tFeHByZXNzaW9uLnNwbGl0KCcuJyk7XHJcbiAgICBpZiAoeC5sZW5ndGggPiAxKSB7XHJcbiAgICAgIHJldHVybiBOdW1iZXIoeFt4Lmxlbmd0aCAtIDFdKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gSW5maW5pdHk7XHJcbiAgfTtcclxuXHJcbiAgcHJpdmF0ZSBjaGVja0FuZFJlbW92ZVN1ZmZpeCA9IChpbnB1dFZhbHVlOiBzdHJpbmcpOiBzdHJpbmcgPT4ge1xyXG4gICAgZm9yIChsZXQgaSA9IHRoaXMuc3VmZml4Py5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xyXG4gICAgICBjb25zdCBzdWJzdHIgPSB0aGlzLnN1ZmZpeC5zdWJzdHIoaSwgdGhpcy5zdWZmaXg/Lmxlbmd0aCk7XHJcbiAgICAgIGlmIChcclxuICAgICAgICBpbnB1dFZhbHVlLmluY2x1ZGVzKHN1YnN0cikgJiZcclxuICAgICAgICAoaSAtIDEgPCAwIHx8ICFpbnB1dFZhbHVlLmluY2x1ZGVzKHRoaXMuc3VmZml4LnN1YnN0cihpIC0gMSwgdGhpcy5zdWZmaXg/Lmxlbmd0aCkpKVxyXG4gICAgICApIHtcclxuICAgICAgICByZXR1cm4gaW5wdXRWYWx1ZS5yZXBsYWNlKHN1YnN0ciwgJycpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gaW5wdXRWYWx1ZTtcclxuICB9O1xyXG5cclxuICBwcml2YXRlIGNoZWNrSW5wdXRQcmVjaXNpb24gPSAoXHJcbiAgICBpbnB1dFZhbHVlOiBzdHJpbmcsXHJcbiAgICBwcmVjaXNpb246IG51bWJlcixcclxuICAgIGRlY2ltYWxNYXJrZXI6IElDb25maWdbJ2RlY2ltYWxNYXJrZXInXVxyXG4gICk6IHN0cmluZyA9PiB7XHJcbiAgICBpZiAocHJlY2lzaW9uIDwgSW5maW5pdHkpIHtcclxuICAgICAgY29uc3QgcHJlY2lzaW9uUmVnRXg6IFJlZ0V4cCA9IG5ldyBSZWdFeHAodGhpcy5fY2hhclRvUmVnRXhwRXhwcmVzc2lvbihkZWNpbWFsTWFya2VyKSArIGBcXFxcZHske3ByZWNpc2lvbn19LiokYCk7XHJcblxyXG4gICAgICBjb25zdCBwcmVjaXNpb25NYXRjaDogUmVnRXhwTWF0Y2hBcnJheSB8IG51bGwgPSBpbnB1dFZhbHVlLm1hdGNoKHByZWNpc2lvblJlZ0V4KTtcclxuICAgICAgaWYgKHByZWNpc2lvbk1hdGNoICYmIHByZWNpc2lvbk1hdGNoWzBdLmxlbmd0aCAtIDEgPiBwcmVjaXNpb24pIHtcclxuICAgICAgICBjb25zdCBkaWZmID0gcHJlY2lzaW9uTWF0Y2hbMF0ubGVuZ3RoIC0gMSAtIHByZWNpc2lvbjtcclxuICAgICAgICBpbnB1dFZhbHVlID0gaW5wdXRWYWx1ZS5zdWJzdHJpbmcoMCwgaW5wdXRWYWx1ZS5sZW5ndGggLSBkaWZmKTtcclxuICAgICAgfVxyXG4gICAgICBpZiAocHJlY2lzaW9uID09PSAwICYmIGlucHV0VmFsdWUuZW5kc1dpdGgoZGVjaW1hbE1hcmtlcikpIHtcclxuICAgICAgICBpbnB1dFZhbHVlID0gaW5wdXRWYWx1ZS5zdWJzdHJpbmcoMCwgaW5wdXRWYWx1ZS5sZW5ndGggLSAxKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIGlucHV0VmFsdWU7XHJcbiAgfTtcclxuXHJcbiAgcHJpdmF0ZSBfc3RyaXBUb0RlY2ltYWwoc3RyOiBzdHJpbmcpOiBzdHJpbmcge1xyXG4gICAgcmV0dXJuIHN0clxyXG4gICAgICAuc3BsaXQoJycpXHJcbiAgICAgIC5maWx0ZXIoKGk6IHN0cmluZywgaWR4OiBudW1iZXIpID0+IHtcclxuICAgICAgICByZXR1cm4gKFxyXG4gICAgICAgICAgaS5tYXRjaCgnXi0/XFxcXGQnKSB8fFxyXG4gICAgICAgICAgaS5tYXRjaCgnXFxcXHMnKSB8fFxyXG4gICAgICAgICAgaSA9PT0gJy4nIHx8XHJcbiAgICAgICAgICBpID09PSAnLCcgfHxcclxuICAgICAgICAgIChpID09PSAnLScgJiYgaWR4ID09PSAwICYmIHRoaXMuYWxsb3dOZWdhdGl2ZU51bWJlcnMpXHJcbiAgICAgICAgKTtcclxuICAgICAgfSlcclxuICAgICAgLmpvaW4oJycpO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBfY2hhclRvUmVnRXhwRXhwcmVzc2lvbihjaGFyOiBzdHJpbmcpOiBzdHJpbmcge1xyXG4gICAgaWYgKGNoYXIpIHtcclxuICAgICAgY29uc3QgY2hhcnNUb0VzY2FwZSA9ICdbXFxcXF4kLnw/KisoKSc7XHJcbiAgICAgIHJldHVybiBjaGFyID09PSAnICcgPyAnXFxcXHMnIDogY2hhcnNUb0VzY2FwZS5pbmRleE9mKGNoYXIpID49IDAgPyAnXFxcXCcgKyBjaGFyIDogY2hhcjtcclxuICAgIH1cclxuICAgIHJldHVybiBjaGFyO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBfc2hpZnRTdGVwKG1hc2tFeHByZXNzaW9uOiBzdHJpbmcsIGN1cnNvcjogbnVtYmVyLCBpbnB1dExlbmd0aDogbnVtYmVyKSB7XHJcbiAgICBjb25zdCBzaGlmdFN0ZXA6IG51bWJlciA9IC9bKj9dL2cudGVzdChtYXNrRXhwcmVzc2lvbi5zbGljZSgwLCBjdXJzb3IpKSA/IGlucHV0TGVuZ3RoIDogY3Vyc29yO1xyXG4gICAgdGhpcy5fc2hpZnQuYWRkKHNoaWZ0U3RlcCArIHRoaXMucHJlZml4Lmxlbmd0aCB8fCAwKTtcclxuICB9XHJcbn1cclxuIl19