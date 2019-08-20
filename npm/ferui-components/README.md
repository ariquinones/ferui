### Installing Ferui Components

1.  Install Ferui Icons package through npm:

    ```
    npm install @ferui/icons
    ```

    - Don't forget to add the polyfill for Custom Elements if not already done:

    ```
    npm install @webcomponents/custom-elements
    ```

2.  Install Ferui Design package through npm:

    ```
    npm install @ferui/design
    ```

3.  Install the Ferui Components angular package through npm:

    ```
    npm install @ferui/angular
    ```

    - If you want to install everything in one command :

    ```
    npm install @ferui/icons @webcomponents/custom-elements @ferui/design @ferui/angular
    ```

4.  Import the FeruiModule into your Angular application's module. Your application's main module might look like this:

    ```
    import { NgModule } from '@angular/core';
    import { BrowserModule } from '@angular/platform-browser';
    import { FeruiModule } from '@ferui/components';
    import { AppComponent } from './app.component';

    @NgModule({
        imports: [
            BrowserModule,
            FeruiModule,
            ....
         ],
         declarations: [ AppComponent ],
         bootstrap: [ AppComponent ]
    })
    export class AppModule {    }
    ```

### Enable ferui-icons

Include the `ferui-icons.min.js` in your HTML file (don't forget the _custom-elements_ polyfill) :

    ```
    <script src="path/to/node_modules/@webcomponents/custom-elements/custom-elements.min.js"></script>
    <script src="path/to/node_modules/@ferui/icons/ferui-icons.min.js"></script>
    ```

### Enable ferui-design

You can either add the compiled css files or the precompiled scss files directly to your project.

#### Importing compiled CSS files

1.  Include the `ferui-design.min.css` and `ferui-icons.min.css` files in your HTML file:

    ```
    <link rel="stylesheet" href="path/to/node_modules/@ferui/design/ferui-design.min.css">
    <link rel="stylesheet" href="path/to/node_modules/@ferui/icons/ferui-icons.min.css">
    ```

2.  Write your HTML with the Ferui Design CSS class names and markup.

#### Importing precompiled Sass files

1.  First, you can create your own \_custom.scss and use it to override the built-in custom variables. Then, use your main Sass file to import your custom variables, followed by ferui-design:

```
...
@import "custom";
// This will import everything from FerUI design.
@import '@ferui/design/ferui-design';

// This will load all the style for icons from FerUI Icons.
@import '@ferui/iconss/ferui-icons';
...
```

- Note : You can load each scss files that you want from `~@ferui/design/` to load only the components that you need.

2.  For Bootstrap to compile, make sure you install and use the required loaders: [sass-loader](https://github.com/webpack-contrib/sass-loader), [postcss-loader](https://github.com/postcss/postcss-loader) with [Autoprefixer](https://github.com/postcss/autoprefixer#webpack).
    With minimal setup, your webpack config should include this rule or similar:

```
...
{
  test: /\.(scss)$/,
  use: [{
    loader: 'style-loader', // inject CSS to page
  }, {
    loader: 'css-loader', // translates CSS into CommonJS modules
  }, {
    loader: 'postcss-loader', // Run postcss actions
    options: {
      plugins: function () { // postcss plugins, can be exported to postcss.config.js
        return [
          require('autoprefixer')
        ];
      }
    }
  }, {
    loader: 'sass-loader' // compiles Sass to CSS
  }]
},
...
```

3.  Write your HTML with the Ferui Design CSS class names and markup.
