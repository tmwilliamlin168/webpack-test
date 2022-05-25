import express from 'express';
import fs from 'fs';
import { createServer } from 'http';
import path from 'path';
import { Server } from 'socket.io';
import webpack from 'webpack';

const DEFAULT_INPUT = `export default function() {
  return (
    <div>
      Hello from webpack + babel!
    </div>
  );
};
`;
const PORT = process.env.PORT || 3001;

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

httpServer.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});

app.use(express.static(path.resolve(__dirname, '../client/build')));

// Stuff to consider:
// webpack mode, BABEL_ENV development vs production
// concurrent compilations is bad?
// 'module' output is experimental? https://github.com/webpack/webpack/issues/2933
// too lazy to think abt browserslist
// output.js is not generated the first time wtever
const path1 = path.resolve(__dirname, 'user_components');
fs.mkdirSync(path1, { recursive: true });
const inputFile = path.resolve(path1, 'input.jsx');
try {
  fs.writeFileSync(inputFile, DEFAULT_INPUT, { flag: 'wx' });
  console.log('input.jsx does not exist, creating one');
} catch (e: any) {
  if (e.code === 'EEXIST')
    console.log('input.jsx already exists');
  else
    console.error(e);
}
let code = fs.readFileSync(inputFile).toString();
let writeLock = false;

process.env.BABEL_ENV = 'production';

app.get('/component.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'user_components/output.js'));
});

const updateCode = (newCode: string) => {
  code = newCode;
  if (writeLock)
    return;
  writeLock = true;
  console.log('try write file');
  fs.writeFile(inputFile, code, err => {
    if (err)
      console.error(err);
    writeLock = false;
    if (newCode !== code) {
      updateCode(code);
      return;
    }
    if (err)
      return;
    console.log('finished write');
    webpack({
      mode: 'production',
      devtool: 'source-map',
      target: ['web', 'es5'],
      entry: inputFile,
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
        return;
      }
      console.log('Finished compiling?');
      io.emit('update');
    });
  });
};

io.on('connection', socket => {
  console.log('socket connected!', socket.id);
  socket.emit('edit', code);

  socket.on('edit', updateCode);
});
