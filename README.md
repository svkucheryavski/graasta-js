improvements t# Interactive apps for teaching and learning statistics and chemometrics

A collection of interactive web applications, which can be used for teaching and learning of applied statistics (app name starts with `asta-`), design of experiments (`doe-`) and methods for multivariate data analysis (`mda-`). The initial version was made using R/Shiny but later has been replaced with the current version, written using [Svelte](https://svelte.dev), so every app is just a single JavaScript file (supplemented with CSS), which can be embedded into any HTML page and be used without a backend.

You can see the full list of all application as well as try them and download the app builds [here](https://graasta.com).

## How to use

If you want to use any app in your project, do the following (here, for example, it is assumed that you selected app *asta-b101*, which is the first app in the list):

1. Download `asta-b101.zip` from the [graasta.com](https://graasta.com). The archive contents a folder `asta-b101` with three files: `asta-b101.js` — the JavaScript code of the app, minified,
 `asta-b101.css` — CSS styles for the app and `index.html` — simple HTML file which can be used
 to run the app locally.

2. Move the first two files to the folders where you keep js and css files (here we assume it is `./js` and `./css`). Open your HTML file and add a DOM element (e.g. `<div>`) with ID `"graasta-app-container"`.

After that just add two lines to the header of the HTML file (between tags `<head>...</head>`):

```html
<link rel='stylesheet' href='/css/asta-b101.css'>
<script defer src='/js/asta-b101.js'></script>
```

And load the file in a browser. Everything should work. You can also look into the `index.html` from the same folder for inspiration.

Here are some important notes about the use of the apps in your own projects:

1. The apps are designed to be shown in 16:9 ratio. They will work with any ratio and any size but 16:9 gives the best view.

2. Smallest size the apps can scale down to is 800x450 pixels. Largest size is limited by 2560x1440 pixels. Anything in between will works just fine.

3. The apps are tested in latest versions of Safari, Chrome and Firefox browsers. They should also work fine in all Chromium based browsers, e.g. Microsoft Edge. Any other browser which supports modern CSS standards and can run Javascript should also work.



