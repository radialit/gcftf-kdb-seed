'use strict';

require('dotenv').config();
const debug = require('debug')('template_parser');
const path = require('path');
const xlsxParser = require('./simple_xlsx_parser');

const C = require('./constants');

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

function parse() {
  const data = {};
  Object.keys(SUBUNIT_TYPE_FILE_LOOKUP).forEach((subunitType) => {
    const fileName = SUBUNIT_TYPE_FILE_LOOKUP[subunitType];
    const filePath = path.join(SOURCE_DATA_TEMPLATE_DIR, fileName);
    try {
      data[subunitType] = parseDataFromXLSX(filePath);
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
