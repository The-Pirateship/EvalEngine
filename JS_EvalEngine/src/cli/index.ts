#!/usr/bin/env node

import { Command } from 'commander';
import { runTests } from './runner';
import { findTestFiles } from './discovery';

const program = new Command();

// Basic CLI setup
program
  .name('eval-engine')
  .description('LLM testing framework - unit tests for AI')
  .version('0.0.1');

// Main test command
program
  .argument('[files...]', 'Test files to run (glob patterns supported)')
  .option('-w, --watch', 'Watch mode - rerun tests on file changes')
  .option('-p, --pattern <pattern>', 'Run tests matching pattern')
  .option('--timeout <ms>', 'Test timeout in milliseconds', '30000')
  .action(async (files, options) => {
    try {
      // Find test files
      const testFiles = await findTestFiles();
      
      if (testFiles.length === 0) {
        console.log('No test files found.');
        process.exit(3);
      }

      console.log(`Running ${testFiles.length} test suite${testFiles.length === 1 ? '' : 's'}...\n`);

      // Run tests
      const results = await runTests(testFiles);
      
      // Show summary
      const totalPassed = results.reduce((sum, r) => sum + r.passed, 0);
      const totalFailed = results.reduce((sum, r) => sum + r.failed, 0);
      const failedSuites = results.filter(r => r.failed > 0);
      
      console.log('\n' + '─'.repeat(50));
      
      if (totalFailed === 0) {
        console.log(`📊 All tests passed! ${totalPassed} test${totalPassed === 1 ? '' : 's'} in ${results.length} suite${results.length === 1 ? '' : 's'}`);
      } else {
        console.log(`📊 ${totalFailed} test${totalFailed === 1 ? '' : 's'} failed, ${totalPassed} passed`);
        console.log(`   ${failedSuites.length} of ${results.length} suite${results.length === 1 ? '' : 's'} failed`);
        
        if (failedSuites.length > 0) {
          console.log('\nFailures:');
          failedSuites.forEach(suite => {
            console.log(`  ${suite.name}:`);
            suite.failures.forEach(failure => {
              console.log(`    ✗ ${failure}`);
            });
          });
        }
      }
      
      process.exit(totalFailed > 0 ? 1 : 0);
      
    } catch (error) {
      console.error('Error running tests:', error);
      process.exit(2);
    }
  });

// Run CLI
if (import.meta.main) {
  program.parse();
}