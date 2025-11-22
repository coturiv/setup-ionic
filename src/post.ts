import * as core from '@actions/core'
import {saveCaches} from './installer'

async function run(): Promise<void> {
  try {
    await saveCaches()
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    core.info(msg)
  }
}

run()
