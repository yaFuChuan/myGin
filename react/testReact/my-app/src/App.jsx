import { useState } from 'react'
import {Fragment} from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import Avatar from './components/avatar.jsx'
import {Form} from './components/avatar.jsx'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.jsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>

      <Form />

    </>
  )
}

function Item({ name,isPacked }){
    let itemContent = name
    if (isPacked){
      itemContent =( 
        <del>
          {name} +"✅"
        </del>
      )
    }
    return( 
      <li className='item'>
        {itemContent}        
      </li>
    );
}

function Toolbar({onPlayMovie, onUploadImage}){
  return(
    <>
      <div className="Toolbar" onClick={()=>{alert('You clicked on the toolbar!');}}>
        <Button onSmash={onPlayMovie}>
          Play movies
        </Button>
        <Button onSmash={onUploadImage}>
          Upload Image
        </Button>
      </div>
    </>
  );
}

function Button({onSmash,children}){
  return(
    <button onClick={(e)=>{
      e.stopPropagation();
      onSmash();
    }}>
      {children}
    </button>
  );
}

function PlayButton({movieName}){
  function handlePlayClick(){
    alert(`playing ${movieName}!`);
  }
  return(
    <Button onSmash={handlePlayClick}>
      Play "{movieName}"
    </Button>
  );
}

function UploadButton(){
  return(
    <Button onSmash={() => alert('Uploading!')}>
      Upload Image
    </Button>
  );
}


export default App
