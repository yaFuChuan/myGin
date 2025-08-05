import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'


const root = createRoot(document.getElementById('root'));
const refresh =()=>{
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}

refresh();
/*
setInterval(()=>{
  refresh();
  counter +=1;
},2000);
*/
