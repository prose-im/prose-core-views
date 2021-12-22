# prose-core-views

As Prose is a native cross-platform application, some views that are deemed too complex to build natively are shared between all apps. Those views are rendered in a lightweight and minimal Web view, and shared between mobile and desktop platforms. This also ensures that the Prose user experience stays consistent between all platforms.

Prose views are built on [`petite-vue`](https://github.com/vuejs/petite-vue), which is a super-lightweight minimal version of VueJS. This ensures that the rendering of elements such as lists stays efficient, usually even more efficient than using barebone native views. All assets get bundled using [`parcel`](https://parceljs.org/), which helps at easing development and produces an optimized production build.

## Installation

To install all the build dependencies, you first need to install NodeJS (version `12` and above).

Then, hit:

```
npm install
```

## Build

Building the Prose core views is done per-target environment. Please check below for build instructions based on your target environment.

### Production target

To build Prose for a production environment (that is, usage within an actual Prose app), hit:

```
npm run build
```

### Development target

To build Prose for a development environment (that is, usage from a browser, while making changes), hit:

```
npm run dev
```

Then, open a Web browser and go to: [localhost:5000](http://localhost:5000/). Any saved changes will be hot-reloaded, you will get live previews.

## Usage

Once built, all assets in `dist/` should be packaged within the Prose native app, and included in a Web view where relevant.

Serialized data should be passed to the view whenever its model needs to be updated.

### Messaging view

🚧 _(WIP)_
