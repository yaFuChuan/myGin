export function getImageUrl(person,size='s'){
  return(
    'https://i.imgur.com/' +
      person.imageId +
      size +
      '.jpg'
  );
}

function Signup(){
  return(
    <form onSubmit={(e)=>{
      e.preventDefault();
      alert('Submitting!')
    }}>
      <input />
      <button>Send</button>
    </form>
  );
}

export default Signup
