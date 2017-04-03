'use strict';

require('dotenv').config();
const program = require('commander');
const debug = require('debug')('index');
const path = require('path');
const fs = require('fs-extra');
const messages = require('./messages');
const tp = require('./template_parser');
// constants
const OUTPUT_DATA_DIR = path.join(__dirname, 'output_data');

// command line setup
program
  .version('0.1.0');
// command-line help listner (must be before .parse)
program.on('--help', () => {
  process.stdout.write(messages.help());
  // commander calls process.exit(0)
});
// finish command line setup
program.parse(process.argv);
// entry point
function main() {
  debug('starting');
  try {
    const data = tp.parse();
    debug(data.entryDatatypeLookup);
    fs.outputJsonSync(path.join(OUTPUT_DATA_DIR, 'section_def.nation.json'), data.sections.nation);
    fs.outputJsonSync(path.join(OUTPUT_DATA_DIR, 'section_def.jurisdiction.json'), data.sections.jurisdiction);
    fs.outputJsonSync(path.join(OUTPUT_DATA_DIR, 'entry_def.scalar.json'), data.entries.scalars);
    fs.outputJsonSync(path.join(OUTPUT_DATA_DIR, 'entry_def.collection.json'), data.entries.collections);
  } catch (err) {
    debug(err);
    debug('quitting');
    process.exit(1);
  }
  debug('finished');
}
debug('\x1Bc'); // clear and reset the console
main(); // entry point
