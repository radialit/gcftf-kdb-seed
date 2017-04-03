# GCF Task Force Knowledge Database Data Parsing and Seeding Script

This script is intended to parse source files from the existing GCF Task Force Knowledge Database. Source files consist of:

(1) Excel workbook files containing both layout and schema information.

(2) XML data files containing actual data values.

This data will be formatted and organized in a better format. Initially data will be saved in JSON files for easy analysis and proof of concept SPA designs. Final data will be stored in MongoDB and served trough a GraphQL API.

## Project Phases

### Phase 1 Parse Structure Files

- [x] Read raw structure files for nation and jurisdiction subunits ('national_template.xlsx' and 'national_template.xlsx' respectively)
- [x] Begin parsing structure data by recognizing whether each row defines a section or entry (schema)
- [x] Parse sections
- [x] Parse entries
- [x] Save sections and entries to JSON output files
- [] Include template_parser tests to check for returned data

### Phase 2 Parse Data (Value) Files

- [x] Include source_data XML value files
- [x] Get a directory listing of directories (synchronous) for use in parsing archives
- [x] Get a directory listing of files (synchronous) since each subunit's data is stored in its own XML file
- [x] Read each XML file (synchronous)
- [x] Parse XML (asynchronous promises) into a raw data
- [x] Parse raw XML data (with most information in attributes) into an array of entry objects suitable for post processing and storing
- [] use archival XML data to determine change times and create approximate "timestamps" for each entry
