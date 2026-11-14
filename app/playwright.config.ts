import { defineConfig } from '@playwright/test';
export default defineConfig({testDir:'./tests',timeout:120000,expect:{timeout:10000},fullyParallel:false,workers:1,reporter:[['list'],['json',{outputFile:'../artifacts/e2e/results.json'}]],use:{baseURL:process.env.BASE_URL||'https://kori-wheat.vercel.app',headless:true,screenshot:'only-on-failure'},outputDir:'../artifacts/e2e/test-output'});
