import {getImageUrl} from './utils.jsx'
import {sculptureList} from './data.jsx'
import {useState} from 'react';
import { useImmer } from 'use-immer';

let nextId = 0;
let initialArtists = [
  { id: 0, name: 'Marta Colvin Andrade' },
  { id: 1, name: 'Lamidi Olonade Fakeye'},
  { id: 2, name: 'Louise Nevelson'},
];
let aPerson = {
  name: 'Niki de Saint Phalle',
  artwork: {
    title: 'Blue Nana',
    city: 'Hamburg',
    image: 'https://i.imgur.com/Sd1AgUOm.jpg',
  }
};

export function List(){
  const [name,setName]=useState('');
  const [artists,setArtists]= useState(initialArtists);

  return(
    <>
      <h1>Inspiring sculptors:</h1>
      <input value={name} onChange={e=>setName(e.target.value)} />
      <button onClick={()=>{
        setArtists([
          ...artists,
          {id : nextId++,name:name },
        ]);
      }}>Add</button>


      <ul>
        {artists.map(artist=>(
          <li key={artist.id}>
            {artist.name}{' '}
            <button onClick={() => {
              setArtists(
                artists.filter(a =>
                  a.id !== artist.id
                )
              );
            }}>
              Delete
            </button>

          </li>
        ))}
      </ul>
    </>
  );
}


export function Form(){
  const [person, setPerson] = useState(aPerson);

  function handleChange(e){
    setPerson({
      ...person,
      [e.target.name]:e.target.value
    })
  }

  function handleFirstNameChange(e) {
    setPerson({
      ...person,
      firstName:e.target.value
    });
  }

  function handleLastNameChange(e) {
    setPerson({
      ...person,
      lastName:e.target.value
    });
  }

  function handleEmailChange(e) {
    setPerson({
      ...person,
      email:e.target.value,
    });
  }

  return(
    <>
    <label>
      First name:
      <input
        value={person.name}
        onChange={handleFirstNameChange}
      />
    </label>
    <label>
      Last name:
      <input
        value={person.artwork.title}
        onChange={handleLastNameChange}
      />
    </label>
      <label>
        Email:
        <input value={person.artwork.city} onChange={handleEmailChange} />
      </label>

      <p>
        {person.name}{' '}
        {person.artwork.title}{' '}
        ({person.artwork.city})
      </p>

    </>
  );
}


function Avatar({ person, size=100, radius }) {
  return(
    <img style={{ borderRadius:radius }}
      className="avatar"
      src={getImageUrl(person)}
      alt={person.name}
      width={size}
      height={size}
    />
  );
}

export function Gallery(){
  const [index,setIndex]=useState(0);
  const [showMore,setShowMore]=useState(false);

  function handleClick(){
    setIndex(index+1);
    if (index === 11) {
      setIndex(0)
    }
  }

  function handleMoreClick(){
    setShowMore(!showMore);
  }
  let sculpture = sculptureList[index];

  return(
    <>
      <button onClick={handleClick}>
        Next
      </button>
      <h2>
        <i>{sculpture.name} </i> 
        by {sculpture.artist}
      </h2>
      <h3>
        ({index + 1} of {sculptureList.length})
      </h3>

      <button onClick={handleMoreClick}>
        {showMore ? 'Hide' :'Show'} details
      </button>

      <img
        src={sculpture.url}
        alt={sculpture.alt}
      />

        {showMore && <p>{sculpture.description}</p>}
    </>
  );
}

export default Avatar
