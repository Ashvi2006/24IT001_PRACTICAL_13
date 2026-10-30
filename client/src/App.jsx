import React from "react";
import Header from "./components/Header.jsx";
import About from "./components/About.jsx";
import Skills from "./components/Skills.jsx";
import TaskManager from "./components/TaskManager.jsx";

function App() {
  return (
    <div style={{ padding: "30px", color: "black" }}>
      <Header />
      <About />
      <Skills />
      <TaskManager />
      
    </div>
  );
}

export default App;