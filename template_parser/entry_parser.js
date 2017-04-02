'use strict';

const debug = require('debug')('entry_parser');

// some data-type codes are being changed
const DATA_TYPE_LOOKUP = {
  num: 'number',
  txt: 'text',
  str: 'string',
  choice: 'enum',
  template: 'template',
};

const PAREN_REGEX = /\((.+)\)/; // locate and extract string inside parenthesis

function parseLabel(arg) {
  let label = arg;
  // end label at start of parenthesis
  const parenMatch = label.match(PAREN_REGEX);
  if (parenMatch) label = label.substr(0, parenMatch.index).trim();
  // remove unwanted 'Section' prefixes
  return label;
}

function parseUnits(arg) {
  let units = '';
  const label = arg;
  const parenMatch = label.match(PAREN_REGEX);
  if (parenMatch && (parenMatch[1] !== '_currency')) {
    units = parenMatch[1];
  }
  return units;
}

function parseChoices(units) {
  if (!units) return null;
  return units.split(',').map(choice => choice.trim());
}
function isCurrency(arg) {
  const parenMatch = arg.match(PAREN_REGEX);
  if (parenMatch && (parenMatch[1] === '_currency')) return true;
  return false;
}

function getDataType(templateObject) {
  // a subsection (not picked up durning section parsing) is always a collection
  if (templateObject.rowType === 'subsection') return 'collection';
  // everything else will be a scalar type
  if (isCurrency(templateObject.label)) return 'currency';
  const dataType = DATA_TYPE_LOOKUP[templateObject.dataType];
  if (dataType !== undefined) return dataType;
  return '';
}

function getNewEntry(rowObj) {
  const entry = {};
  entry.id = rowObj.rowID;
  entry.label = parseLabel(rowObj.label);
  entry.units = parseUnits(rowObj.label);
  entry.choices = [];
  entry.translations = { label: {}, units: {} };
  Object.keys(rowObj.translations).forEach((langCode) => {
    entry.translations.label[langCode] = parseLabel(rowObj.translations[langCode]);
    entry.translations.units[langCode] = parseUnits(rowObj.translations[langCode]);
  });
  // debug(entry.type);
  return entry;
}

function getNewScalarEntry(templateObject) {
  const entry = getNewEntry(templateObject);
  entry.type = getDataType(templateObject);
  const isEnum = (entry.type === 'enum');
  if (isEnum) {
    // choices are specified in units field
    entry.choices = parseChoices(entry.units);
    entry.units = '';
    entry.translations.choices = {};
    Object.keys(entry.translations.units).forEach((langCode) => {
      // choices are specified in units field
      entry.translations.choices[langCode] = parseChoices(entry.translations.units[langCode]);
      entry.translations.units[langCode] = '';
    });
  }
  return entry;
}

function getNewCollectionEntry(templateObject) {
  const entry = getNewEntry(templateObject, 'collection');
  entry.type = templateObject.rowID;
  entry.entries = [];
  return entry;
}

function pushCollectionEntry(entry, rowObj) {
  entry.entries.push(getNewScalarEntry(rowObj));
}

module.exports = { getDataType, getNewScalarEntry, getNewCollectionEntry, pushCollectionEntry };
