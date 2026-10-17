/** Screen dive: one wrapper transform; the game never knows. */
export function toggleDive(body:HTMLElement,room:HTMLElement,reduced:boolean){
  const on=body.classList.toggle('dive'); room.style.transition=reduced?'none':'transform .6s ease-in'; room.style.transform=on&&!reduced?'scale(1.9)':''; return on; }
