# GCF Task Force Knowledge Database Data Parsing and Seeding Script

This script is intended to parse source files from the existing GCF Task Force Knowledge Database. Source files consist of:

(1) Excel workbook files containing both layout and schema information.

(2) XML data files containing actual data values.

This data will be formatted and organized in a better format. Initially data will be saved in JSON files for easy analysis and proof of concept SPA designs. Final data will be stored in MongoDB and served trough a GraphQL API.

## Project Phases

### Phase 1 (Parse Structure Files)

- [x] Read raw structure files for nation and jurisdiction subunits ('national_template.xlsx' and 'national_template.xlsx' respectively)
- [x] Begin parsing structure data by recognizing whether each row defines a section or entry (schema)
- [x] Parse sections
- [x] Parse entries
- [] Save sections and entries to JSON files
