#!/usr/bin/env node
// npm links this file as the `viscosity` command. Calling main() here, not
// on import, means it runs however the file was reached (symlink, npx, ...).
import { main } from '../dist/viscosity.mjs';
process.exit(main(process.argv.slice(2)));
