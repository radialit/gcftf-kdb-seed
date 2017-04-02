'use strict';

require('dotenv').config();
const program = require('commander');
const debug = require('debug')('index');
const messages = require('./messages');
const tp = require('./template_parser');
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
    debug(data);
  } catch (err) {
    debug(err);
    debug('quitting');
    process.exit(1);
  }
  debug('finished');
}
debug('\x1Bc'); // clear and reset the console
main(); // entry point
