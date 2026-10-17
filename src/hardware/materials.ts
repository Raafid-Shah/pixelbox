import { materials } from '../theme/tokens';
export const gradient=(id:string,m:keyof typeof materials)=>`<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${materials[m].hi}"/><stop offset=".5" stop-color="${materials[m].base}"/><stop offset="1" stop-color="${materials[m].sh}"/></linearGradient>`;
export const woodFilter=`<filter id="grain"><feTurbulence type="fractalNoise" baseFrequency=".02 .5" numOctaves="3" seed="7"/><feColorMatrix values="0 0 0 0 .25  0 0 0 0 .13  0 0 0 0 .05  0 0 0 .55 0"/><feComposite in2="SourceGraphic" operator="in"/></filter>`;
