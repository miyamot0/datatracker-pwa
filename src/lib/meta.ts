import { Metadata } from "next";

const DEFAULT_TITLE = "DataTracker";
const DEFAULT_DESCRIPTION = "Web-based port of the Data Tracker application.";
const DEFAULT_ADDRESS = "https://data-tracker-web.vercel.app";

const title = DEFAULT_TITLE;
const applicationName = DEFAULT_TITLE;

const description = DEFAULT_DESCRIPTION;

export const DEFAULT_METADATA: Metadata = {
  title: {
    default: DEFAULT_TITLE,
    template: "%s | DataTracker",
  },
  description,
  applicationName,
  authors: [
    {
      name: "Shawn Gilroy",
      url: "https://www.smallnstats.com",
    },
  ],
  generator: "Next.js",
  // TODO: Add more keywords
  keywords: ["DataTracker"],
  creator: "Shawn P. Gilroy",
  // TODO: Decide on a publisher
  //publisher: "Vercel",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title,
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
    address: false,
    date: false,
  },
  twitter: {
    title,
    description,
    images: [`${DEFAULT_ADDRESS}/icon-192.png`],
  },
  openGraph: {
    title,
    description,
    images: [
      {
        url: `${DEFAULT_ADDRESS}/icon-192.png`,
        width: 192,
        height: 192,
        alt: title,
      },
    ],
  },
};
