'use strict';

require('dotenv').config();
const debug = require('debug')('tests-value_parser');
// const path = require('path');
const test = require('tape');
const vp = require('../value_parser');

// const TEST_DATA_DIR = path.join(__dirname, 'data');
// const SOURCE_DATA_VALUE_DIR = tp.SOURCE_DATA_VALUE_DIR;
// const SOURCE_DATA_TEMPLATE_FILE_NAMES = vp.SOURCE_DATA_TEMPLATE_FILE_NAMES;
// const VALID_FILE_NAME = SOURCE_DATA_TEMPLATE_FILE_NAMES[0];
// const VALID_FILE_PATH = path.join(SOURCE_DATA_TEMPLATE_DIR, VALID_FILE_NAME);
// const INVALID_FILE_PATH = path.join(TEST_DATA_DIR, 'not_an_actual_file');
// const BADFILE_FILE_PATH = path.join(TEST_DATA_DIR, 'not_really_xml.xml');

test('getSubdirListSync()', (t) => {
  // t.plan(1);

  t.true((Array.isArray(vp.getSubdirListSync()) && vp.getSubdirListSync().length),
    'getSubdirListSync() should return an array of non-zero length');

  t.end();
});

test('getFileListSync()', (t) => {
  const subdirList = vp.getSubdirListSync();

  subdirList.forEach((subdir) => {
    const files = vp.getFileListSync(subdir);
    if (!Array.isArray(files)) t.fail(`the argument ${subdir} did not return an array`);
  });

  t.pass('getFileListSync(subdir) should return an array of file names in subdir for all subdirs returned by getSubdirListSync()');

  t.end();
});

test('readSubdirSync', (t) => {
  const subdirList = vp.getSubdirListSync();

  subdirList.forEach((subdir) => {
    const subdirFileContent = vp.readSubdirSync(subdir);
    if (!Array.isArray(subdirFileContent)) t.fail(`the argument ${subdir} did not return an array`);
  });

  t.pass('fileContentBySubunit(subdir) should return an array for all subdirs returned by getSubdirListSync()');

  t.end();
});
