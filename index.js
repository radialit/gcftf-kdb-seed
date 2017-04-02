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
  const data = tp.parse();
  debug(data);
  debug('finished');
}
main(); // entry point
