'use strict';

require('dotenv').config();
const debug = require('debug')('raw-values');
const cheerio = require('cheerio');
const numeral = require('numeral');

function string(rawString) {
  if (!rawString) return '';
  let cleanerString = rawString.trim();
  // convert spaces and non-breaking spaces, and their
  // unicode and HTML entity variants to plain onld spaces ' '
  cleanerString = cleanerString.replace(/\xA0/g, ' ');
  cleanerString = cleanerString.replace(/\x20/g, ' ');
  cleanerString = cleanerString.replace(/&#32;/g, ' ');
  cleanerString = cleanerString.replace(/&#160;/g, ' '); // non-breaking space
  cleanerString = cleanerString.replace(/\s+/g, ' ').trim(); // remove multiple spaces
  cleanerString = cleanerString.replace(/^"|"$/g, ' ').trim(); // remove leading and trailing double quotes
  if (cleanerString === '--blank--') return '';
  return cleanerString;
}

function html(rawHTML) {
  let cleanerHTML = string(rawHTML);
  if (!cleanerHTML) return '';
  // remove line breaks
  cleanerHTML = cleanerHTML.replace(/(\r\n|\n|\r)/gm, '').trim();
  // check for blanks
  if (cleanerHTML.length === 0) return '';
  if (cleanerHTML === '<br>') return '';
  if (cleanerHTML === '<br/>') return '';
  if (cleanerHTML === '<br />') return '';
  if (cleanerHTML === '<p></p>') return '';
  // clean up the DOM
  const $ = cheerio.load(`<body>${cleanerHTML}</body>`);
  $('body').find('*').each((i, elem) => {
    const $elem = $(elem);
    if (elem.tagName === 'style') {
      $elem.remove();
    } else {
      // remove attributes
      if ($elem.attr('style')) $elem.attr('style', null);
      if ($elem.attr('class')) $elem.attr('class', null);
      if ($elem.attr('border')) $elem.attr('border', null);
      if ($elem.attr('cellspacing')) $elem.attr('cellspacing', null);
      if ($elem.attr('cellpadding')) $elem.attr('cellpadding', null);
      if ($elem.attr('width')) $elem.attr('width', null);
      if (elem.tagName === 'span') {
        const text = $elem.text().trim();
        if (text.length === 0) {
          $elem.remove();
        } else {
          $elem.replaceWith(text);
        }
        // console.log('removing span');
      }
    }
    // console.log($(elem).attr('style'));
  });
  const paragraphs = $('p');
  if (paragraphs.length === 0) {
    const divs = $('body').find('div');
    if (divs.length === 0) {
      let newParagraphs = $('body').html().split('<br>');
      newParagraphs = newParagraphs.map(paragraph => paragraph.trim());
      newParagraphs = newParagraphs.filter(paragraph => paragraph !== '');
      return `<p>${newParagraphs.join('</p><p>')}</p>`;
    }
    divs.each((i, elem) => {
      const $elem = $(elem);
      if ($elem.parents().length === 1) {
        const htmlValue = $elem.html().trim();
        if (html.length === 0) {
          $elem.remove();
        } else {
          $elem.replaceWith(`<p>${htmlValue}</p>`);
        }
      }
    });
  } else {
    paragraphs.each(((i, elem) => {
      const $elem = $(elem);
      if ($elem.html().trim().length === 0) {
        $elem.remove();
      }
    }));
  }
  return $('body').html();
}

function integer(rawString) {
  const int = Number.parseInt(rawString, 10);
  // for non-integers, return null instead of NaN
  if (Number.isNaN(int)) return null;
  return int;
}

function number(rawString) {
  if (!(typeof rawString === 'string')) return NaN;
  const cleanString = rawString.trim();
  if (cleanString.length === 0) return NaN;
  // console.log(`'${cleanString}'`);
  const numberObj = numeral(cleanString);
  const value = numberObj.value();
  if (typeof value === 'object' && !value) {
    debug('WARN: "%s" couldn\'t be converted to a number (null)', cleanString);
    return NaN;
  }
  if (Number.isNaN(value)) {
    debug('WARN: "%s" couldn\'t be converted to a number (NaN)', cleanString);
    return NaN;
  }
  return number.value();
}

module.exports = { html, string, integer, number };
