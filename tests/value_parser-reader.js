'use strict';

const test = require('tape');
const vpr = require('../value_parser/reader');

test('getSubdirListSync()', (t) => {
  // t.plan(1);

  t.true((Array.isArray(vpr.getSubdirListSync()) && vpr.getSubdirListSync().length),
    'getSubdirListSync() should return an array of non-zero length');

  t.end();
});

test('getFileListSync()', (t) => {
  const subdirList = vpr.getSubdirListSync();

  subdirList.forEach((subdir) => {
    const files = vpr.getFileListSync(subdir);
    if (!Array.isArray(files)) t.fail(`the argument ${subdir} did not return an array`);
  });

  t.pass('getFileListSync(subdir) should return an array of file names in subdir for all subdirs returned by getSubdirListSync()');

  t.end();
});

test('readSubdirSync', (t) => {
  const subdirList = vpr.getSubdirListSync();

  subdirList.forEach((subdir) => {
    const subdirFileContent = vpr.readSubdirSync(subdir);
    if (!Array.isArray(subdirFileContent)) t.fail(`the argument ${subdir} did not return an array`);
  });

  t.pass('fileContentBySubunit(subdir) should return an array for all subdirs returned by getSubdirListSync()');

  t.end();
});
