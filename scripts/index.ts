import * as fs from 'fs';
import packageJson from '../package.json';
import licenses from '../src/assets/licenses.json';
import coverageSummary from '../coverage/coverage-summary.json';
import path from 'path';
import { read } from 'to-vfile';
import { matter } from 'vfile-matter';

const DOCUMENTATION_FOLDER = path.join(process.cwd(), 'content');

/**
 * Write out current build date to string for easy reference
 */
function write_date() {
  const build_date = new Date().toLocaleDateString('en-US');
  const object_to_write = {
    date: build_date,
  };

  fs.writeFileSync('./src/assets/build_date.json', JSON.stringify(object_to_write), 'utf-8');
}

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

async function outputFrontMatterData() {
  const front_matter_data = {
    information: [] as unknown[],
  };

  const files = fs.readdirSync(DOCUMENTATION_FOLDER);

  for (const file of files) {
    const filePath = path.join(DOCUMENTATION_FOLDER, file);
    const fileContent = await read(filePath, 'utf-8');
    matter(fileContent);

    const fileContentString = fileContent.value.toString().split('---');

    const full_out = {
      value: fileContentString[2],
      matter: fileContent.data.matter,
    };

    front_matter_data.information.push(full_out);
  }

  fs.writeFileSync('./src/assets/documentation.json', JSON.stringify(front_matter_data), 'utf-8');
}

const converage_pct = `${coverageSummary.total.lines.pct}_Percent`;
const version_text = `Version ${packageJson.version}\r\n`;
const software_pkg_text = populate_software().join('\r\n \r\n');

let coverage_color = coverageSummary.total.statements.pct < 80 ? 'orange' : 'green';

let readme_md = read_md();
readme_md = readme_md.replace('{{VERSION}}', version_text);
readme_md = readme_md.replace('{{VERSION_NUMBER}}', packageJson.version);
readme_md = readme_md.replace('{{LICENSES}}', software_pkg_text);
readme_md = readme_md.replace('{{PERCENTAGE}}', converage_pct);
readme_md = readme_md.replace('{{PERCENTAGE_COLOR}}', coverage_color);

write_md(readme_md);

write_date();

await outputFrontMatterData();
