// @ts-check

import {themes as prismThemes} from 'prism-react-renderer';

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'B-Farm Simulation Docs',
  tagline: 'คู่มือหน้า Simulation แบบสั้น กระชับ และเริ่มใช้งานได้ทันที',
  favicon: 'img/logo.svg',
  future: {
    v4: true,
  },
  url: 'http://localhost:3000',
  baseUrl: '/simulation/docs/',
  organizationName: 'nstda',
  projectName: 'hackcable-simulation-docs',
  onBrokenLinks: 'throw',
  i18n: {
    defaultLocale: 'th',
    locales: ['th'],
  },
  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.js',
          routeBasePath: '/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      },
    ],
  ],
  themeConfig: {
    image: 'img/simulation/getting-started-overview.png',
    colorMode: {
      defaultMode: 'light',
      disableSwitch: false,
      respectPrefersColorScheme: false,
    },
    navbar: {
      title: 'B-Farm Docs',
      logo: {
        alt: 'B-Farm Docs Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: 'Simulation',
        },
        {
          to: '/getting-started',
          label: 'เริ่มต้นใช้งาน',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'light',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'เริ่มต้นใช้งาน',
              to: '/getting-started',
            },
          ],
        },
      ],
      copyright: `Built with Docusaurus • ${new Date().getFullYear()} B-Farm Simulation Docs`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  },
};

export default config;
