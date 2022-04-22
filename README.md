# ConfMon &middot; [![GitHub license](https://img.shields.io/badge/license-GNU-blue.svg)](https://github.com/victorkirov/confmon/blob/main/LICENSE) [![npm version](https://img.shields.io/npm/v/confmon.svg?style=flat)](https://www.npmjs.com/package/confmon)

ConfMon loads configuration from a variety of files and custom sources and combines them into one global object. It then monitors those files for changes and allows the user to subscribe to change events on any node in the configuration, so that the software can react to configuration changes without a restart.

This library was specifically designed for, but is not limited to, use in Kubernetes where Config Maps and Secrets update when their value is changed and they are mounted in a container as a file.

Please note, this library is still in alpha phase, so the interface and usage can change without notice.

## TODOS
- Complete README
- Do the TODO comments
- Improve typing and remove as many castings to `any` as possible
- Tests, tests, tests
- Figure out when errors are thrown and how they are handled

## Quick start
TODO

## Why another config library?
TODO

## Config files
Configuration files should exist in a single directory. They can be in any of the following formats: `json`, `json5`, `hjson`, `cson`, `toml`, `yaml`, `xml`, and `ini`. A custom extension, `confval`, was also implemented and is described [below](#direct-value-files-with-confval-files).

By default, the configuration directory is located at `<working_directory>/config`. This can be set to a relative path from the working directory, or to an absolute path by setting the `CONFMON_PATH` environment variable.

Files in the config directory are loaded alphabetically with a lexicographical ordering and merged in that order. This means that a value defined in a file will be overwritten if it exists in a file with a later lexicographical filename.

### Direct value files with .confval files
TODO

### Loading environment variables
TODO

## API
TODO

### Getting config values
TODO

### Subscribing to/unsubscribing from change events
TODO
