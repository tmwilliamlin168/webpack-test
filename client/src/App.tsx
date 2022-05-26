import ansiHTML from 'ansi-html-community';
import React, { useEffect, useState } from 'react';
import io, { Socket } from 'socket.io-client';

import './App.css';

const Loading = () => {
  return (
    <span>
      Loading...
    </span>
  );
};

const App = () => {
  const [Component, setComponent] = useState(() => Loading);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [code, setCode] = useState('');
  const [compileInfo, setCompileInfo] = useState('Compilation info will appear here');

  const updateComponent = async () => {
    // webpack will change import() into something different
    const c = (await eval(`import('/component.js?' + Date.now())`)).default;
    setComponent(() => c);
  };

  useEffect(() => {
    // Required so the dynamically imported components can access React
    // - Importing React in the component (with explicit import statement or @babel/preset-react automatic runtime) works but adds unnecessary bundle size, might waste time to bundle & send
    // - Could somehow pass in React to a function to pass it into the component but that's kinda hacky
    window.React = React;
    updateComponent();
  }, []);

  useEffect(() => {
    const socket = io();
    setSocket(socket);

    socket.on('connect', () => console.log('connected'));
    socket.on('edit', setCode);
    socket.on('update', (errors, warnings) => {
      updateComponent();
      setCompileInfo((errors.length ? '<b>Errors:</b>\n' + errors.join('\n') : '<b>No Errors</b>\n') + '\n' + (warnings.length ? '<b>Warnings:</b>\n' + warnings.join('\n') : '<b>No Warnings</b>\n'));
    });

    return () => {socket.close()};
  }, []);

  return (
    <div className="App">
      <div className="Code-Pane">
        <textarea value={code} onChange={e => {
          setCode(e.target.value);
          socket!.emit('edit', e.target.value);
        }} />
        <div className="Compile-Info" dangerouslySetInnerHTML={{__html: ansiHTML(compileInfo)}} />
      </div>
      <div className="Preview-Pane">
        <Component />
      </div>
    </div>
  );
}

export default App;
