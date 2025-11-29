# Why This Local Synth Folder Was Archived

## Date: September 7, 2025

## Reason for Archiving
This local version of the synth service was archived because it was missing the `/process-input` endpoint that exists on the deployed Cloud Run service.

## What Was Missing
- The local files only had `/process-all` and `/process-single` endpoints
- The server had `/process-input` endpoint that takes raw user input and does 500-character chunking internally
- The server version is more complete and matches the architecture described in the README

## What We Did
1. Archived this outdated local version with timestamp
2. Downloaded the current server files to replace the local version
3. This ensures local and server are in sync

## Server Details
- URL: https://fta-synth-pyh6ygakfa-uc.a.run.app
- Has `/process-input`, `/process-all`, and `/process-single` endpoints
- `/process-input` expects `input` parameter and does chunking internally
