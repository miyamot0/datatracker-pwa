import * as fs from 'fs';
import packageJson from '../package.json';
import licenses from '../src/assets/licenses.json';
import coverageSummary from '../coverage/coverage-summary.json';

/**
 * Populate the software section of the README with the licenses
 */
function populate_software() {
  return licenses.map((relevant_license) => {
    const author = relevant_license.author.trim() === 'na' ? '' : ` ${relevant_license.author}`;
    const license = relevant_license?.licenseType ?? 'Error';

    return `${relevant_license.name} (${
      relevant_license.installedVersion
    }). Copyright${author} -- ${license} Licensed: [Repo](${relevant_license.link.replace('git+', '')}) `;
  });
}

/**
 * Pull the contents of the README.md file
 *
 * @returns the contents of the README.md file
 */
function read_md() {
  return fs.readFileSync('./scripts/README.md', 'utf-8');
}

/**
 * Write the contents to the README.md file
 *
 * @param content the content to write to the README.md file
 */
function write_md(content: string) {
  fs.writeFileSync('README.md', content, 'utf-8');
}

//const version_text = `Version ${packageJson.version}\r\n`;
const software_pkg_text = populate_software().join('\r\n \r\n');
const st_lines = `${coverageSummary.total.statements.pct.toFixed(2)}%`;
const br_lines = `${coverageSummary.total.branches.pct.toFixed(2)}%`;
const fn_lines = `${coverageSummary.total.functions.pct.toFixed(2)}%`;

let readme_md = read_md();
readme_md = readme_md
  //.replace('{{VERSION}}', version_text)
  .replace('{{VERSION_NUMBER}}', packageJson.version)
  .replace('{{LICENSES}}', software_pkg_text)
  .replace('{{STPCT}}', st_lines)
  .replace('{{BRPCT}}', br_lines)
  .replace('{{FNPCT}}', fn_lines);

write_md(readme_md);
