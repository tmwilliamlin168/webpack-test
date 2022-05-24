import React from 'react';
import { useEffect, useState } from 'react';
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

  return (
    <div className="App">
      <div className="Code-Pane">
        Code
      </div>
      <div className="Preview-Pane">
        <Component />
      </div>
    </div>
  );
}

export default App;
