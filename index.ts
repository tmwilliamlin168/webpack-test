import express from 'express';
import path from 'path';
import webpack from 'webpack';

const PORT = process.env.PORT || 3001;

const app = express();

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});

app.use(express.static(path.resolve(__dirname, '../client/build')));

// Stuff to consider:
// webpack mode, BABEL_ENV development vs production
// concurrent compilations is bad?
// 'module' output is experimental? https://github.com/webpack/webpack/issues/2933
// too lazy to think abt browserslist
const path1 = path.resolve(__dirname, 'user_components');
process.env.BABEL_ENV = 'production';
webpack({
  mode: 'production',
  devtool: 'source-map',
  target: ['web', 'es5'],
  entry: path.resolve(path1, 'input.jsx'),
  output: { path: path1, filename: 'output.js', library: {type: 'module'} },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        include: path1,
        loader: 'babel-loader',
        options: {
          presets: ['@babel/preset-env', '@babel/preset-react'],
        },
      },
    ],
  },
  experiments: { outputModule: true },
}, (err, stats) => {
  if (err || stats?.hasErrors()) {
    console.error(err || stats?.compilation.errors);
  }
  console.log('Finished compiling?');
});

app.get('/component.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'user_components/output.js'));
});