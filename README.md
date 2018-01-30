# Update Jan. 18, 2018

Hello fellow developer. I see you've discovered this package. And, well, it's old. Here's what I've found out:

- Grunt hasn't aged all that well and the uglifier breaks the build.
- Unfortunately the Fedora repo requires the .min file on the other end.
- So I'm creating a .min.js file that's not actually minified. This makes it work and minification happens in the main app anyway.

Good luck, hopefully we can just delete this repo someday.

# An Angular module for Ink File Picker

This frontend module was designed to work specifically with our [filepicker_client ruby gem](https://github.com/infowrap/filepicker_client).

Learn more about Ink File Picker [here](https://www.inkfilepicker.com/)

This project is currently in `Alpha`.

## Setup

```
	npm install
```
