var JalaliJs = require('../utils/jalali-js');
var _ = require('underscore');

function convertNumbersToPersian(inputString) {
    return inputString
        .replace(/0/g, '۰')
        .replace(/٠/g, '۰')
        .replace(/1/g, '۱')
        .replace(/١/g, '۱')
        .replace(/2/g, '۲')
        .replace(/٢/g, '۲')
        .replace(/3/g, '۳')
        .replace(/٣/g, '۳')
        .replace(/4/g, '۴')
        .replace(/٤/g, '۴')
        .replace(/5/g, '۵')
        .replace(/٥/g, '۵')
        .replace(/6/g, '۶')
        .replace(/٦/g, '۶')
        .replace(/7/g, '۷')
        .replace(/٧/g, '۷')
        .replace(/8/g, '۸')
        .replace(/٨/g, '۸')
        .replace(/9/g, '۹')
        .replace(/٩/g, '۹');

}

function convertNumbersToEnglish(inputString) {
    return inputString
        .replace(/۰/g, '0')
        .replace(/٠/g, '0')
        .replace(/۱/g, '1')
        .replace(/١/g, '1')
        .replace(/۲/g, '2')
        .replace(/٢/g, '2')
        .replace(/۳/g, '3')
        .replace(/٣/g, '3')
        .replace(/۴/g, '4')
        .replace(/٤/g, '4')
        .replace(/۵/g, '5')
        .replace(/٥/g, '5')
        .replace(/۶/g, '6')
        .replace(/٦/g, '6')
        .replace(/۷/g, '7')
        .replace(/٧/g, '7')
        .replace(/۸/g, '8')
        .replace(/٨/g, '8')
        .replace(/۹/g, '9')
        .replace(/٩/g, '9');
}

function convertShamsiToMillisecond(shamsiDate) {
    if (!_.isEmpty(shamsiDate)) {
        let jToG = JalaliJs.toGregorian(parseInt(convertNumbersToEnglish(shamsiDate.split('/')[0])),
            parseInt(convertNumbersToEnglish(shamsiDate.split('/')[1])),
            parseInt(convertNumbersToEnglish(shamsiDate.split('/')[2])));
        let date = new Date(jToG.gy, jToG.gm, jToG.gd);
        return date.getTime();
    } else {
        return undefined;
    }
}

function convertMillisecondToShamsi(millisecond) {
    if (millisecond !== undefined && millisecond !== null) {
        let date = new Date(millisecond);
        let jalaliDate = JalaliJs.toJalaali(date.getFullYear(), date.getMonth(), date.getDate());
        return convertNumbersToPersian(jalaliDate.jy.toString()) + '/' + convertNumbersToPersian(jalaliDate.jm.toString()) + '/' + convertNumbersToPersian(jalaliDate.jd.toString());
    } else {
        return '';
    }
}

function separateNumberWithCommas(number) {
    return (number + '').replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function commify(value){
    if (!_.isEmpty(value)) {
        value = value.replace(/,/g, '');
        var chars = value.split("").reverse();
        var withCommas = [];
        for(var i = 1; i <= chars.length; i++ ){
            withCommas.push(chars[i-1]);
            if(i%3 === 0 && i !== chars.length ){
                withCommas.push(",")
            }
        }
        return withCommas.reverse().join("");
    } else {
        return '';
    }
}

module.exports = {
    convertNumbersToEnglish,
    convertNumbersToPersian,
    convertShamsiToMillisecond,
    convertMillisecondToShamsi,
    separateNumberWithCommas,
    commify
};
