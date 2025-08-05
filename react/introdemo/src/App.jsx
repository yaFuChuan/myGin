//import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import Note from './components/Note.jsx'
import axios from 'axios'
import { useState, useEffect } from 'react'

function App() {
  const [notes, setNotes] = useState([]);
  useEffect(()=>{
    console.log('effect')
    axios
      .get('http://localhost:3001/notesi')
      .then(response => {
        console.log(notes);
        setNotes(response.data);
      })
  },[])
  console.log('render', notes.length, 'notes')

  const [count, setCount] = useState(0)
  const [left,setLeft] = useState(0)
  const [right,setRight] = useState(0)
  const [clickab,setClickab] = useState([]);
  const [sumPress,setSum]=useState(0);
  const handleClick =() => {
    console.log('hello world,energy302');
    const updateZero =0
    setRight(updateZero)
  };

  const handlerLeft = () =>{
    setClickab(clickab.concat('L'))
    const updateLeft = left+1;
    setLeft(updateLeft)
    setSum(updateLeft+right);
  };

  const handlerRight = () =>{
    setClickab(clickab.concat('R'));
    const updateR = right+1;
    setRight(updateR)
    setSum(left+updateR);
  };

  const History = (props) =>{
    console.log('props value is ;',props);
    if (props.clickab.length === 0) {
      return(
        <div>the app is used by pressing the buttons</div>
      )
    }
    return(
      <div>
          button press history: {props.clickab.join(' ')}
      </div>

    )
  }

  const Button = ({onClick,text})=><button onClick={onClick}>{text}</button>;
  console.log('App works...');

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
      
      <div>
          {left}
          <Button onClick={handleClick} text={"left button is :"+left} />
          <Button onClick={handlerRight} text={"Right button :"+right} />
          {right}

          <p>ab join :{clickab.join("-")}</p>
          <p>Press total:{sumPress}</p>
      </div>

      <History clickab={clickab} />
      <Collections notes={notes} />
    </>
  )
}

const Hello=({name,age})=>{
  const bornYear=()=>{
      return new Date().getFullYear()-age
  }

  return(
  <>
      <p>
        Hello {name}, you are {age} years old
      </p>
      <p>So you were probably born in {bornYear()}</p>
  </>
  )
}

const Collections =(props) =>{
  const [notes, setNotes] = useState(props.notes);
  const [newNote, setNewNote] = useState('a new note...');
  const [showAll, setShowAll] = useState(false);

  const notesToShow = showAll ? notes : notes.filter(note=>note.important ===true );

  const addNote = (event) => {
    event.preventDefault()
    const noteObject ={
      content : newNote,
      important: Math.random() < 0.5,
      id: String(notes.length + 1),
    }
    setNotes(notes.concat(noteObject));
    setNewNote('');
  }

  const handleNoteChange=(event)=>{
    console.log(event.target.value)
    setNewNote(event.target.value)
  }

  return(
    <div>
      <h1>Notes</h1>
      <ul>
        {notesToShow.map((note)=>
          <Note key={note.id} note={note} />
        )}
      </ul>

      <form onSubmit={addNote}>
        <input />
        <input value={newNote} onChange={handleNoteChange} />
        <button type="submit" onClick={()=>setShowAll(!showAll)}>
          save:{showAll ? 'important': 'all'}
        </button>
      </form>
      
    </div>
  )
}


const notes =[
  {
    id: 1,
    content: 'HTML is easy',
    important: true
  },
  {
    id: 2,
    content: 'Browser can execute only JavaScript',
    important: false
  },
  {
    id: 3,
    content: 'GET and POST are the most important methods of HTTP protocol',
    important: true
  }
];

export default App
