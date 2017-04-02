'use strict';

const debug = require('debug')('tests-template_parser');
const path = require('path');
const test = require('tape');
const tp = require('../template_parser');

const TEST_DATA_DIR = path.join(__dirname, 'data');
const SOURCE_DATA_TEMPLATE_FILE_NAMES = tp.SOURCE_DATA_TEMPLATE_FILE_NAMES;
const SOURCE_DATA_TEMPLATE_DIR = tp.SOURCE_DATA_TEMPLATE_DIR;
const VALID_FILE_NAME = SOURCE_DATA_TEMPLATE_FILE_NAMES[0];
const VALID_FILE_PATH = path.join(SOURCE_DATA_TEMPLATE_DIR, VALID_FILE_NAME);
const INVALID_FILE_PATH = path.join(TEST_DATA_DIR, 'not_an_actual_file');
const BADFILE_FILE_PATH = path.join(TEST_DATA_DIR, 'not_really_xlsx.xlsx');

test('parseDataFromXLSX(filePath)', (t) => {
  t.plan(3);

  t.throws(() => tp.parseDataFromXLSX(INVALID_FILE_PATH),
  'parseDataFromXLSX(filePath) should throw an error when filePath file doesn\'t exist');

  t.throws(() => tp.parseDataFromXLSX(BADFILE_FILE_PATH),
  'parseDataFromXLSX(filePath) should throw an error when filePath file is not a valid XLSX file');

  t.equal(typeof tp.parseDataFromXLSX(VALID_FILE_PATH), 'object',
    'parseDataFromXLSX(filePath) should return an object when passed the (full) path to a valid XLSX file');

  t.end();
});
