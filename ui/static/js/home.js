const images = [
  /*
  "/static/img/President_1.jpg" ,  
  "/static/img/brand_01.jpg"    ,
  "/static/img/brand_02.jpg"    ,
  "/static/img/brand_03.jpg"    ,
  "/static/img/Lego.png"        ,
  "/static/img/KunDa.png" 
  */
];

const header1 = document.createElement('header');
const h1_img = document.createElement('img');
//h1_img.src="/static/img/word3.png";
header1.appendChild(h1_img);

const html = document.documentElement;
const body = document.body;
const header = document.querySelector('header');
const nav = document.querySelector('nav');
const myMain = document.querySelector('main');
const footer = document.querySelector('footer');

nav.parentNode.insertBefore(header1, nav.nextSibling);
//header1.style.border="3px solid red";
//h1_img.style.border="3px solid black";
header1.style.backgroundColor='#F1FFF4';
myMain.style.backgroundColor='#F1FFF4'; 

function getAverageRGB(imgEl) {
  const canvas = document.createElement('canvas');
  canvas.width = imgEl.width;
  canvas.height = imgEl.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(imgEl, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  let r = 0, g = 0, b = 0, count = 0;
  for (let i = 0; i < data.length; i += 4) {
    r += data[i];
    g += data[i + 1];
    b += data[i + 2];
    count++;
  }

  const avgR = Math.floor(r / count)+15;
  const avgG = Math.floor(g / count)+15;
  const avgB = Math.floor(b / count)+15;
  const hex = ((1 << 24) + (avgR << 16) + (avgG << 8) + avgB).toString(16).slice(1);
  return '#' + hex;
}

function changeColor() {
  const randomColor = `rgb(${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)})`;
  body.style.backgroundColor = randomColor;
}
//myMain.style.height = '80vh';
//nav.style.width = '100%';

const imgElement = document.createElement('img');
myMain.appendChild(imgElement);

const mainWidth=myMain.clientWidth;
const mainHeight=myMain.clientHeight;

const imgWidth = mainWidth * 0.9;
const imgHeight = imgElement.clientHeight;

  const padding = 10; 
  imgElement.style.width = imgWidth + 'px';
  imgElement.style.margin = '0.5% 10% 2% 5%';

let currentImageIndex = 0;
imgElement.src =images[currentImageIndex];

/*
setInterval(() => {
  currentImageIndex = (currentImageIndex + 1) % images.length;
  //console.log(currentImageIndex," 被除數:",currentImageIndex + 1," 除數:",images.length);
  imgElement.src = images[currentImageIndex];
},3000);
*/

//imgElement.src = images[0];
//let i =0;

function showImage() {
  imgElement.src = images[i];

  //const m_img = document.querySelector('main img');  
  //console.log(m_img);
  //const averageColor = getAverageRGB(m_img);         
  //document.body.style.backgroundColor = averageColor; 
   
  if(i==images.length-1){
    i = 0;
  }else{
    i++;
  }
  //console.log(images[i],"index",i,images.length);
}

//setInterval(showImage, 5000);

const navItems = document.querySelectorAll('.menu li')

navItems.forEach(item => {
  item.addEventListener('mouseover', () => {
    const subMenu = item.querySelector('.subMenu');
    if (subMenu) {
      subMenu.style.display = 'block';
    }
  });

  item.addEventListener('mouseout', () => {
    const subMenu = item.querySelector('.subMenu');
    if (subMenu) {
      subMenu.style.display = 'none';
    }
  });
});

footer.style.height = `calc(100vh - ${nav.offsetHeight + myMain.offsetHeight}px)`;  
