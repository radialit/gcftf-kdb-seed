'use strict';

require('dotenv').config();
const debug = require('debug')('template_parser');
const path = require('path');
const xlsxParser = require('../simple_xlsx_parser');
const sp = require('./section_parser');
const C = require('../constants');

const SOURCE_DATA_DIR = C.SOURCE_DATA_DIR;
const SOURCE_DATA_TEMPLATE_DIR = path.join(SOURCE_DATA_DIR, 'field_templates');

const SUBUNIT_TYPE_FILE_LOOKUP = {
  nation: 'national_template.xlsx',
  jurisdiction: 'state_template.xlsx',
};
const SOURCE_DATA_TEMPLATE_FILE_NAMES = Object.keys(SUBUNIT_TYPE_FILE_LOOKUP)
  .map(key => SUBUNIT_TYPE_FILE_LOOKUP[key]);

function parseDataFromXLSX(filePath) {
  let data;
  try {
    const parsedObj = xlsxParser.parseArray(
      filePath, { rowStartIndex: 1 });
    data = parsedObj.data;
  } catch (err) {
    let msg;
    if (err.code === 'ENOENT') {
      msg = `Template file "${filePath}" could not be found'`;
    } else {
      msg = `Template file "${filePath}" was found but could not be parsed as a valid .xlsx file'`;
    }
    throw new Error(msg);
  }
  return data;
}
// spreadsheet cells can contain undefined or string or number
function stringify(arg) {
  return ((arg === undefined) ? '' : String(arg)).trim();
}

function stringifyLabel(arg) {
  let label = stringify(arg);
  label = label.replace(/km2/gi, 'km²');
  label = label.replace(/CO2/gi, 'CO₂');
  label = label.replace(/CO2/gi, 'CO₂');
  label = label.replace(/\+\/-/gi, '±');
  return label;
}

function getRowObj(rowArray) {
  return {
    rowType: rowArray[0],
    rowID: rowArray[1],
    dataType: rowArray[2],
    label: stringifyLabel(rowArray[4]),
    translations: {
      es: stringifyLabel(rowArray[5]),
      id: stringifyLabel(rowArray[6]),
      pt: stringifyLabel(rowArray[7]),
      fr: stringifyLabel(rowArray[8]),
    },
  };
}

function parse() {
  const data = { sections: {} };
  Object.keys(SUBUNIT_TYPE_FILE_LOOKUP).forEach((subunitType) => {
    data.sections[subunitType] = [];
    const fileName = SUBUNIT_TYPE_FILE_LOOKUP[subunitType];
    const filePath = path.join(SOURCE_DATA_TEMPLATE_DIR, fileName);
    try {
      const rows = parseDataFromXLSX(filePath);
      let activeSection = {};
      let activeEntry = {};
      let sectionHeaderLevelOffset = 0;
      let entryIDPrefix = '';
      rows.forEach((rowArray) => {
        // keyed object is easier to work with than an array
        const rowObj = getRowObj(rowArray);
        if (rowObj.label.substr(0, 1) === '#') return; // comment--skip
        if (sp.isSection(rowObj)) { // this row defines a section
          if (!sp.isValid(rowObj)) {
            sectionHeaderLevelOffset += 1; // correct for the eliminated section
            return;
          }
          const newSection = sp.getNewSection(rowObj, sectionHeaderLevelOffset);
          // a subsection that no longer defines a collection must have its ID prefixed to
          // all entries coming under it (e.g. 'safeguards_overview' instead of just 'overview')
          if (rowObj.dataType !== 'label') entryIDPrefix = sp.getEntryPrefix(rowObj);
          newSection.paragraphCode = sp.getNewSectionParagraphCode(
            activeSection.paragraphCode, newSection.headerLevel);
          activeSection = newSection;
          data.sections[subunitType].push(activeSection);
          // debug(newSection);
        } else { // this row defines an entry (schema definition)
          // debug('entry');
        }
        // debug(rowObj);
      });
    } catch (err) {
      throw err;
    }
  });
  return data;
}

module.exports = {
  SOURCE_DATA_TEMPLATE_DIR,
  SOURCE_DATA_TEMPLATE_FILE_NAMES,
  parseDataFromXLSX,
  parse };
