import { useMDXComponents } from "@/mdx-components";
import fs from "fs";
import { compileMDX } from "next-mdx-remote/rsc";
import path from "path";

const DOCUMENTATION_FOLDER = path.join(process.cwd(), "content");

/**
 * This is the type for all frontmatter in MDs
 */
export type FrontMatterUniversalType = {
  title: string;
  filename: string;
  date: string;
  keywords: string;
  author: string;
  index: number;
};

/**
 * This gets each MD by relevant filename
 *
 * @param slug
 * @returns
 */
export const getEntryBySlug = async (slug: string) => {
  const filePath = path.join(DOCUMENTATION_FOLDER, slug);
  const fileContent = fs.readFileSync(filePath, { encoding: "utf-8" });

  const { frontmatter, content } = await compileMDX<FrontMatterUniversalType>({
    source: fileContent,
    options: { parseFrontmatter: true },
    components: useMDXComponents,
  });

  return {
    frontmatter,
    content,
  };
};

/**
 * Get all values for listings
 *
 * @returns
 */
export const getAllEntriesMeta = async () => {
  const files = fs.readdirSync(DOCUMENTATION_FOLDER);

  const entries = [];
  for (const file of files) {
    const output = await getEntryBySlug(file);
    entries.push(output);
  }

  return entries;
};
