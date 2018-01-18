# Update Jan. 18, 2018

Hello fellow developer. I see you've discovered this package. And, well, it's old. Here's what I've found out:

- Grunt hasn't aged all that well and the uglifier breaks the build.
- Since Teachable always minifies JavaScript in the main app and since the bower entrypoint here is the non-minified file, I just removed uglify altogether.
- In order to run the build install, run `npm install`, `npm install -g grunt`, `grunt build` or `grunt watch`.

Good luck, hopefully we can just delete this repo someday.

# An Angular module for Ink File Picker

This frontend module was designed to work specifically with our [filepicker_client ruby gem](https://github.com/infowrap/filepicker_client).

Learn more about Ink File Picker [here](https://www.inkfilepicker.com/)

This project is currently in `Alpha`.

## Setup

```
	npm install
```
